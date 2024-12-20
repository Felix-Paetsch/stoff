import triangle_data from "./unicorns/triangle_data.js";

class Vector {
    constructor(x = 0, y = 0, column = true) {
        if (x instanceof Vector){
            y = x.y;
            x = x.x;
        }

        if (
            !(typeof x === 'number' && isFinite(x))
         || !(typeof y === 'number' && isFinite(y))
        ){
            throw new Error("Vector entries are not proper numbers!");
        }

        this.is_column = column;
        this.is_row = !column;

        this.set(x, y);
    }

    to_array(){
        return [this.x, this.y];
    }

    set(x, y) {
        if (x instanceof Vector){
            return this.set(x[0], x[1]);
        }

        this.x = x;
        this.y = y;
        this[0] = x;
        this[1] = y;
        return this;
    }

    dot(vec) {
        return this[0] * vec[0] + this[1] * vec[1];
    }

    cross(vec){
        return this.x * vec.y - this.y * vec.x;
    }

    distance(vec) {
        return Math.sqrt(
            Math.pow(this.x - vec.x, 2) + Math.pow(this.y - vec.y, 2)
        );
    }

    mult(el) {
        if (typeof el == "number") {
            return this.scale(el);
        }

        if (el instanceof Vector) {
            if (this.is_row && el.is_column) {
                return this.dot(el);
            }
            if (this.is_column && el.is_row) {
                return new Matrix(
                    new Vector(this[0] * el[0], this[1] * el[0]),
                    new Vector(this[0] * el[1], this[1] * el[1])
                );
            }
            // Both are the same, mult piecewise
            return new Vector(this[0] * el[0], this[1] * el[1], this.is_row);
        }

        if (el instanceof Matrix) {
            return el.transpose().mult(this.transpose()).transpose();
        }
    }

    transpose() {
        return new Vector(this.x, this.y, !this.is_column);
    }

    scale(a) {
        return new Vector(this.x * a, this.y * a);
    }

    to_len(a){
        if (this.length() < 0.000000000001){
          throw new Error("Vector is (almost) 0");
        }
        return this.normalize().scale(a);
    }

    add(vec) {
        return new Vector(this.x + vec.x, this.y + vec.y);
    }

    subtract(vec) {
        return this.add(vec.scale(-1));
    }

    mirror_at(vec){
      return vec.scale(2).subtract(this);
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    length_squared() {
        return this.x * this.x + this.y * this.y;
    }

    normalize() {
        return this.scale(1 / this.length());
    }

    get_orthogonal() {
        return new Vector(this.y, -1 * this.x);
    }

    get_orthonormal() {
        return new Vector(this.y, -1 * this.x).normalize();
    }

    toString(){
        return `[${
            this.x.toString().slice(
                0, this.x.toString().split('.')[0].length + 4
            )
        }, ${
            this.y.toString().slice(
                0, this.y.toString().split('.')[0].length + 4
            )
        }]`
    }

    toJSON(){
        return this.to_array();
    }

    print() {
        function fmt(n) {
            return (n.toString() + "     ").slice(0, 5);
        }

        if (this.is_column) {
            return console.log(`| ${fmt(this[0])} |\n| ${fmt(this[1])} |`);
        }
        console.log(`| ${fmt(this[0])} ${fmt(this[1])} |`);
        return this;
    }

    rotate(angle) {
        return rotation_fun(new Vector(0, 0), angle)(this);
    }

    copy(){
      return new Vector(this.x, this.y);
    }
}

class Matrix {
    constructor(vec1, vec2, column_wise = true) {
        // Column_wise is for convenience. Otherwise we could check if vec1 and vec2 are rows or columns
        if (column_wise) {
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

    transpose() {
        return new Matrix(
            new Vector(this[0][0], this[1][0]),
            new Vector(this[0][1], this[1][1])
        );
    }

    print() {
        function fmt(n) {
            return (n.toString() + "     ").slice(0, 5);
        }

        console.log(
            `| ${fmt(this.row1[0])} ${fmt(this.row1[1])} |\n| ${fmt(
                this.row2[0]
            )} ${fmt(this.row2[1])} |`
        );

        return this;
    }

    scale(a) {
        return new Matrix(this.row1.scale(a), this.row2.scale(a));
    }

    det() {
        return this[0][0] * this[1][1] - this[0][1] * this[1][0];
    }

    invert() {
        const pre_scaled = new Matrix(
            new Vector(this[1][1], this[0][1] * -1),
            new Vector(this[1][0] * -1, this[0][0])
        );
        return pre_scaled.scale(1 / this.det());
    }

    add(m) {
        return new Matrix(this.col1.add(m.col1), this.col2.add(m.col2));
    }

    mult(el) {
        if (el instanceof Vector) {
            const col1_scaled = this.col1.scale(el[0]);
            const col2_scaled = this.col2.scale(el[1]);
            return col1_scaled.add(col2_scaled);
        } else if (el instanceof Matrix) {
            return new Matrix(this.mult(el.col1), this.mult(el.col2));
        } else return this.scale(el);
    }

    toJSON(){
        return [this.col1.toJSON(), this.col2.toJSON()];
    }

    toString(){
        return `[${ this.col1.toString() }, ${ this.col2.toString() }]]`
    }
}

function distance_from_line(line_points, vec) {
    const [vec1, vec2] = line_points;

    const vec1ToVec = vec.subtract(vec1);
    const vec1ToVec2 = vec2.subtract(vec1);

    // Calculate the projection of vec1ToVec onto vec1ToVec2
    const projection = vec1ToVec.dot(vec1ToVec2) / vec1ToVec2.dot(vec1ToVec2);

    // Calculate the closest point on the line
    const closestPoint = new Vector(
        vec1.x + projection * vec1ToVec2.x,
        vec1.y + projection * vec1ToVec2.y
    );

    // Calculate the distance from vec to the closest point on the line
    return vec.subtract(closestPoint).length();
}

function distance_from_line_segment(endpoints, vec) {
    return closest_vec_on_line_segment(endpoints, vec).distance(vec);
}

function closest_vec_on_line_segment(endpoints, vec) {
    const [vec1, vec2] = endpoints;

    const vec1ToVec = vec.subtract(vec1);
    const vec1ToVec2 = vec2.subtract(vec1);
    const lineSegmentLength = vec1ToVec2.length();

    if (lineSegmentLength < 0.000001){
      return vec1.add(vec2).scale(0.5);
    }

    // Calculate the projection of vec1ToVec onto vec1ToVec2
    const projection =
        vec1ToVec.dot(vec1ToVec2) / (lineSegmentLength * lineSegmentLength);

    if (projection < 0) {
        // Closest to vec1
        return vec1;
    } else if (projection > 1) {
        return vec2;
    } else {
        // Perpendicular distance to the line segment
        const closestPoint = new Vector(
            vec1.x + projection * vec1ToVec2.x,
            vec1.y + projection * vec1ToVec2.y
        );
        return closestPoint;
    }
}

function line_segments_intersect(l1, l2) {
    const [p, r] = [l1[0], l1[1].subtract(l1[0])];
    const [q, s] = [l2[0], l2[1].subtract(l2[0])];

    const rxs = r.cross(s);
    const qmp = q.subtract(p);
    const t = qmp.cross(s) / rxs;
    const u = qmp.cross(r) / rxs;

    if (rxs === 0) {
        return [false, null];
    }

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const intersection = p.add(r.scale(t));
        return [true, intersection];
    }

    return [false, null];
}

function matrix_from_input_output(f_in, f_out) {
    // Expect Col Vectors
    // f_in  = [vec1, vec2]
    // f_out = [A*vec1, A*vec2]
    // returns A

    const inp_matrix = new Matrix(f_in[0], f_in[1]);
    const out_matrix = new Matrix(f_out[0], f_out[1]);

    return out_matrix.mult(inp_matrix.invert());
}

function affine_transform_from_input_output(f_in, f_out) {
    // f_in --- f ---> f_out
    // f_in  = [vec1, vec2]
    // f_out = [f(vec1), f(vec2)]

    // Assumes A is (Uniform-Stretch) + Rotation
    // f(x) = Ax + b
    const A_inp1 = f_in[0].subtract(f_in[1]);
    const A_out1 = f_out[0].subtract(f_out[1]);

    const A_inp2 = A_inp1.get_orthogonal();
    const A_out2 = A_out1.get_orthogonal();

    const A = matrix_from_input_output([A_inp1, A_inp2], [A_out1, A_out2]);
    const b = f_out[0].subtract(A.mult(f_in[0])); // f(x) - Ax;

    return (vec) => {
        return A.mult(vec).add(b);
    };
}

function orthogonal_transform_from_input_output(v1, v2) {
    // v1 gets rotated and stretched to v2
    return affine_transform_from_input_output(
        [new Vector(0, 0), v1],
        [new Vector(0, 0), v2]
    );
}

function rotation_fun(rotation_vec, angle) {
    // Returns function that takes in a vector and rotates it `angle` around rotation_vec
    const rotMatrix = new Matrix(
        new Vector(Math.cos(angle), Math.sin(angle)),
        new Vector(-1 * Math.sin(angle), Math.cos(angle))
    );
    return (v) => {
        return rotMatrix.mult(v.subtract(rotation_vec)).add(rotation_vec);
    };
}

function vec_angle(vec1, vec2, reference = ZERO) {
    vec1 = vec1.subtract(reference);
    vec2 = vec2.subtract(reference);

    const dotProduct = vec1.dot(vec2);
    const lengthsProduct = vec1.length() * vec2.length();

    const cosineTheta = Math.max(-1, Math.min(1, dotProduct / lengthsProduct));
    const angle = Math.acos(cosineTheta);

    return angle || 0;
}


function vec_angle_clockwise(vec1, vec2, reference = ZERO, offset_range = false){
    if (typeof reference == "boolean"){
        offset_range = reference;
        reference = ZERO;
    }

    vec1 = vec1.subtract(reference);
    vec2 = vec2.subtract(reference);

    const dot = vec1.dot(vec2);
    const cross = vec1.x * vec2.y - vec1.y * vec2.x; // 2D cross product
    let angle = Math.acos(dot / (vec1.length() * vec2.length()));

    if (isNaN(angle)){
        return Math.PI;
    }

    if (cross < 0) {
        angle = 2 * Math.PI - angle; // Clockwise angle adjustment
    }

    if (angle > Math.PI && !offset_range) angle = angle - 2 * Math.PI

    return angle;
}

function bounding_box(points){
    let _min_x = Infinity;
    let _min_y = Infinity;
    let _max_x = - Infinity;
    let _max_y = - Infinity;

    points.forEach(p => {
        _min_x = Math.min(p.x, _min_x);
        _max_x = Math.max(p.x, _max_x);
        _min_y = Math.min(p.y, _min_y);
        _max_y = Math.max(p.y, _max_y);
    });

    return {
        width:  points.length == 0 ? 0 : _max_x - _min_x,
        height: points.length == 0 ? 0 : _max_y - _min_y,
        top_left: points.length == 0 ? ZERO : new Vector(_min_x, _min_y),
        top_right: points.length == 0 ? ZERO : new Vector(_max_x, _min_y),
        bottom_left:  points.length == 0 ? ZERO : new Vector(_min_x, _max_y),
        bottom_right: points.length == 0 ? ZERO : new Vector(_max_x, _max_y),
        left: _min_x,
        right: _max_x,
        top: _min_y,
        bottom: _max_y
    }
}

function convex_hull(points) {
    if (points.length <= 1) return points;

    // Sort points lexicographically by x, then by y
    points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    const lower = [];
    for (const p of points) {
        while (lower.length >= 2 && lower[lower.length - 2].subtract(lower[lower.length - 1]).cross(p.subtract(lower[lower.length - 1])) <= 0) {
            lower.pop();
        }
        lower.push(p);
    }

    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        while (upper.length >= 2 && upper[upper.length - 2].subtract(upper[upper.length - 1]).cross(p.subtract(upper[upper.length - 1])) <= 0) {
            upper.pop();
        }
        upper.push(p);
    }

    // Remove the last point of each half because it's repeated at the beginning of the other half
    upper.pop();
    lower.pop();

    // Concatenate lower and upper hulls
    return lower.concat(upper);
}

function deg_to_rad(d) {
    return (Math.PI * d) / 180;
}

function rad_to_deg(r) {
    return (180 / Math.PI) * r;
}

const ZERO = new Vector(0,0);
const UP = new Vector(0,-1);
const LEFT = new Vector(-1,0);
const RIGHT = new Vector(1,0);
const DOWN = new Vector(0,1);

export {
    Vector,
    Matrix,
    affine_transform_from_input_output,
    orthogonal_transform_from_input_output,
    closest_vec_on_line_segment,
    distance_from_line_segment,
    distance_from_line,
    convex_hull,
    bounding_box,
    deg_to_rad,
    rad_to_deg,
    vec_angle,
    vec_angle_clockwise,
    rotation_fun,
    triangle_data,
    line_segments_intersect,
    ZERO,
    UP,
    DOWN,
    LEFT,
    RIGHT
};
