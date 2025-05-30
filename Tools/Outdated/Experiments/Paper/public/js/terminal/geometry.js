class Vector{
    constructor(x,y, column=true){
        this.is_column =  column;
        this.is_row    = !column;

        this.set(x,y);
    }

    set(x,y){
        this.x = x;
        this.y = y;
        this[0] = x;
        this[1] = y;
    }

    dot(vec){
        return this[0]*vec[0] + this[1] * vec[1];
    }

    mult(el){
        if (typeof el == "number"){
            return this.scale(el);
        }

        if (el instanceof Vector){
            if (this.is_row && el.is_column){
                return this.dot(el);
            }
            if (this.is_column && el.is_row){
                return new Matrix(new Vector(this[0] * el[0], this[1] * el[0]), new Vector(this[0] * el[1], this[1] * el[1]));
            }
            // Both are the same, mult piecewise
            return new Vector(this[0]*el[0], this[1]*el[1], this.is_row);
        }

        if (el instanceof Matrix){
            return (el.transpose().mult(this.transpose())).transpose();
        }
    }

    transpose(){
        return new Vector(this.x, this.y, !this.is_column);
    }

    scale(a){
        return new Vector(this.x * a, this.y * a);
    }

    add(vec){
        return new Vector(this.x + vec.x, this.y + vec.y);
    }

    subtract(vec){
        return this.add(vec.scale(-1));
    }

    length(){
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(){
        return this.scale(this.length());
    }

    get_orthogonal(){
        return new Vector(this.y, -1*this.x);
    }

    get_orthonormal(){
        return new Vector(this.y, -1*this.x).normalize();
    }

    print(){
        function fmt(n){
            return (n.toString() + "     ").slice(0, 5)
        }

        if (this.is_column){
            return console.log(`| ${ fmt(this[0]) } |\n| ${ fmt(this[1]) } |`);
        }
        console.log(`| ${ fmt(this[0]) } ${ fmt(this[1]) } |`);
    }
}

class Matrix{
    constructor(vec1, vec2, column_wise = true){
        // Column_wise is for convenience. Otherwise we could check if vec1 and vec2 are rows or columns
        if (column_wise){
            this.col1 = vec1;
            this.col2 = vec2;
    
            this.row1 = new Vector(this.col1[0], this.col2[0]);
            this.row2 = new Vector(this.col1[1], this.col2[1]);
        } else {
            this.row1 = vec1;
            this.row2 = vec2;

            this.col1 = new Vector(this.row1[0], this.row2[0]);
            this.col2 = new Vector(this.row1[1], this.row2[1]);
        }
        

        this[0] = this.row1;
        this[1] = this.row2;
    }

    transpose(){
        return new Matrix(
            new Vector(this[0][0], this[1][0]), 
            new Vector(this[0][1], this[1][1])
        )
    }

    print(){
        function fmt(n){
            return (n.toString() + "     ").slice(0, 5)
        }

        console.log(`| ${ fmt(this.row1[0]) } ${ fmt(this.row1[1]) } |\n| ${ fmt(this.row2[0]) } ${ fmt(this.row2[1]) } |`)
    }

    scale(a){
        return new Matrix(this.row1.scale(a), this.row2.scale(a));
    }

    det(){
        return this[0][0]*this[1][1] - this[0][1]*this[1][0];
    }

    invert(){
        const pre_scaled = new Matrix(
            new Vector(this[1][1],           this[0][1] * -1), 
            new Vector(this[1][0] * -1,      this[0][0])
        );
        return pre_scaled.scale(1/this.det());
    }

    add(m){
        return new Matrix(this.col1.add(m.col1), this.col2.add(m.col2))
    }

    mult(el){
        if (el instanceof Vector){
            const col1_scaled = this.col1.scale(el[0]);
            const col2_scaled = this.col2.scale(el[1]);
            return col1_scaled.add(col2_scaled);
        } else if (el instanceof Matrix){
            return new Matrix(this.mult(el.col1), this.mult(el.col2));
        } else return this.scale(el);
    }
}

function matrix_from_input_output(f_in, f_out){
    // Expect Col Vectors
    // f_in  = [vec1, vec2]
    // f_out = [A*vec1, A*vec2]
    // returns A

    const inp_matrix = new Matrix(f_in[0] , f_in[1] );
    const out_matrix = new Matrix(f_out[0], f_out[1]);

    return out_matrix.mult(inp_matrix.invert());
}

function affine_transform_from_input_output(f_in, f_out){
    // f_in --- f ---> f_out
    // f_in  = [vec1, vec2]
    // f_out = [f(vec1), f(vec2)]

    // Assumes A is (Uniform-Stretch) + Rotation
    // f(x) = Ax + b
    const A_inp1 = f_in [0].subtract(f_in[1] );
    const A_out1 = f_out[0].subtract(f_out[1]);

    const A_inp2 = A_inp1.get_orthogonal();
    const A_out2 = A_out1.get_orthogonal();

    const A = matrix_from_input_output([A_inp1, A_inp2], [A_out1, A_out2]);
    const b = f_out[0].subtract(A.mult(f_in[0])); // f(x) - Ax;

    return (vec) => { return A.mult(vec).add(b); }
}

function affine_transform_from_normalized_to_anchors(anchor1, anchor2){
    return affine_transform_from_input_output([CONST_RELATIVE_ANCHOR_1, CONST_RELATIVE_ANCHOR_2], [anchor1, anchor2]);
}

function affine_transform_from_anchors_to_normalized(anchor1, anchor2){
    return affine_transform_from_input_output([anchor1, anchor2], [CONST_RELATIVE_ANCHOR_1, CONST_RELATIVE_ANCHOR_2]);
}

function rotation_fun(rotation_point, angle){
    // Is this correct direction?
    const rotMatrix = new Matrix(new Vector(Math.cos(angle), Math.sin(angle)), new Vector(-1 * Math.sin(angle), Math.cos(angle)));
    return (v) => { return rotMatrix.mult(v.subtract(rotation_point)).add(rotation_point); };
}

function vec_angle_clockwise(vec1, vec2){
    // Starting from vec1, xrichtung im Uhrzeigersinn
    const v_reference = new Vector(1,0);
    const v_target    = vec2.subtract(vec1);
    const scalar = v_target.y < 0 ? -1 : 1;
    return scalar * Math.acos(v_reference.dot(v_target) / (v_reference.length() * v_target.length()));
}

function const_relative_anchor_angle(){
    return vec_angle_clockwise(CONST_RELATIVE_ANCHOR_1, CONST_RELATIVE_ANCHOR_2);
}

CONST_RELATIVE_ANCHOR_1 = new Vector(1000,250);
CONST_RELATIVE_ANCHOR_2 = new Vector(100,50);