const { Vector, affine_transform_from_input_output } = require("../Geometry/geometry.js");

class Line{
    constructor(endpoint_1, endpoint_2, sample_points){
        /*
            Sample points is an array of values [x(t), y(t)] with
            x(t), y(t) relative to the endpoints, t starts at 0 (including it) and goes to 1 (including it)

            I.E. x moves along P1->P2 (with x(0) being P1, x(1) being P2) and y perpendicular in same scale
            There might be exceptions to the above but very hard to deal with!!    
        */

        this.p1 = endpoint_1;
        this.p2 = endpoint_2;

        this.sample_points = sample_points;

        function approx_eq(v1, v2){
            return v1.subtract(v2).length_squared() < .01
        }

        if (approx_eq(this.sample_points[0], new Vector(0,0))){
            this.sample_points[0] = new Vector(0,0);
        } else {
            throw new Error("Line sample points dont start with (0,0)");
        }

        if (approx_eq(this.sample_points[this.sample_points.length - 1], new Vector(1,0))){
            this.sample_points[this.sample_points.length - 1] = new Vector(1,0);
        } else {
            throw new Error("Line sample points dont end with (1,0)");
        }

        endpoint_1.add_adjacent_line(this);
        endpoint_2.add_adjacent_line(this);
    }

    get_sample_points(){
        return this.sample_points;
    }

    cut_sample_points_at(index_from, from_percentage_after, index_to, to_percentage_after){
        const cut_sample_points = this.sample_points.slice(index_from, index_to + 2); // One after last one included if needed interpolation
        
        if (from_percentage_after > 0){
            cut_sample_points[0] = cut_sample_points[0].mult(1 - from_percentage_after)
                                    .add(cut_sample_points[1].mult(from_percentage_after));
        }

        if (to_percentage_after == 0 && !(index_to + 1 == this.sample_points.length)){
            cut_sample_points.pop();
        } else if (to_percentage_after == 0) {} else {
            const l = cut_sample_points.length - 1;
            cut_sample_points[l] = cut_sample_points[l - 1].mult(1 - to_percentage_after)
                                      .add(cut_sample_points[l].mult(to_percentage_after));
        }

        const transform_func = affine_transform_from_input_output(
            [cut_sample_points[0], cut_sample_points[cut_sample_points.length - 1]],
            [new Vector(0,0), new Vector(1,0)]
        );

        const res = cut_sample_points.map(p => transform_func(p));
        return res;
    }

    get_to_relative_function(){
        return affine_transform_from_input_output(
            [this.p1,  this.p2],
            [new Vector(0,0), new Vector(1,0)]
        );
    }

    get_to_absolute_function(){
        return affine_transform_from_input_output(
            [new Vector(0,0), new Vector(1,0)],
            [this.p1,  this.p2]
        );
    }

    get_absolute_sample_points(){
        const to_absolute = this.get_to_absolute_function();
        return this.sample_points.map(p => {
            return to_absolute(p)
        });
    }

    get_line_vector(){
        return this.p2.subtract(this.p1);
    }

    get_endpoints(){
        return [this.p1, this.p2];
    }

    mirror(direction = false){
        if (!(direction == false)){
            const t = this.p1;
            this.p1 = this.p2;
            this.p2 = t;
            // This performs double mirror
        }
        this.sample_points.forEach(p => p.set(p.x, - p.y));
        return this;
    }

    _swap_orientation(){
        // Traverse spline the other way around
        const t = this.p1;
        this.p1 = this.p2;
        this.p2 = t;
        this.sample_points.reverse();
        this.sample_points.forEach(p => p.set(1 - p.x, p.y));
    }

    endpoint_distance(){
        return this.p1.distance(this.p2);
    }

    get_length(){
        const endpoint_distance = this.endpoint_distance();
        let sum = 0;

        for (let i = 0; i < this.sample_points.length; i++){
            sum += Math.sqrt(
                Math.pow(this.sample_points[i][1] - this.sample_points[i+1][1], 2),
                Math.pow(this.sample_points[i][2] - this.sample_points[i+1][2], 2)
            );
        }

        return sum * endpoint_distance;
    }

    get_bounding_box(){
        let _min_x = Infinity;
        let _min_y = Infinity;
        let _max_x = - Infinity;
        let _max_y = - Infinity;

        this.get_absolute_sample_points().forEach(p => {
            _min_x = Math.min(p.x, _min_x);
            _max_x = Math.max(p.x, _max_x);
            _min_y = Math.min(p.y, _min_y);
            _max_y = Math.max(p.y, _max_y);
        });

        return {
            width:  _max_x - _min_x,
            height: _max_y - _min_y,
            top_left:  new Vector(_min_x, _min_y),
            top_right: new Vector(_max_x, _min_y),
            bottom_left:  new Vector(_min_x, _max_y),
            bottom_right: new Vector(_max_x, _max_y)
        }
    }
}

class StraightLine extends Line{
    constructor(endpoint_1, endpoint_2, density){
        const n = Math.ceil(1 / density);

        super(
            endpoint_1, 
            endpoint_2, 
            Array.from({ length: n + 1 }, (v, i) => new Vector(i/n, 0))
        );
    }
}

module.exports = { StraightLine, Line };