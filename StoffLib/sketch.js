const { Vector, affine_transform_from_input_output, distance_from_line_segment } = require("../Geometry/geometry.js");
const { StraightLine, Line } = require('./line.js');
const { ConnectedComponent } = require("./connected_component.js");
const { interpolate_colors } = require("./colors.js");
const { validate_sketch } =  require("./validation.js");
const { create_svg_from_sketch, save_as_svg } = require("./rendering/to_svg.js");
const { create_png_from_sketch, save_as_png } = require("./rendering/to_png.js");
const { Point } = require("./point.js");
const { toA4printable } = require("./rendering/to_A4_pages.js");
const { copy_sketch, copy_connected_component, default_data_callback, copy_sketch_obj_data } = require("./copy.js");
const path = require('path');
const CONF = require("./config.json");

const {
    _intersect_lines,
    _intersection_positions
} = require("./unicorns/intersect_lines.js");

class Sketch{
    constructor(){
        this.sample_density = CONF.DEFAULT_SAMPLE_POINT_DENSITY;
        this.points = [];
        this.lines  = [];
        this.data   = {};
    }

    get_bounding_box(){
        let _min_x = Infinity;
        let _min_y = Infinity;
        let _max_x = - Infinity;
        let _max_y = - Infinity;

        this.lines.forEach(l => {
            const { top_left, bottom_right } = l.get_bounding_box();

            _min_x = Math.min(top_left.x, _min_x);
            _max_x = Math.max(bottom_right.x, _max_x);
            _min_y = Math.min(top_left.y, _min_y);
            _max_y = Math.max(bottom_right.y, _max_y);
        });

        this.points.forEach(p => {
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

    point(x, y){
        const pt = new Point(x,y);
        return this.add_point(pt);
    }

    add(thing){
        if (thing instanceof Point || thing instanceof Vector){
            return this.add_point(thing);
        }

        throw new Error("Currently cannot add things of this type to the sketch");
    }

    add_point(pt){
        if (!(pt instanceof Point)){
            return this.add_point(Point.from_vector(pt));
        }
        this.points.push(pt);
        return pt;
    }

    get_points(){
        return this.points;
    }

    get_lines(){
        return this.lines;
    }

    connected_component(sketch_el){
        this._guard_sketch_elements_in_sketch(sketch_el);
        return ConnectedComponent(sketch_el);
    }

    delete_component(sketch_el){
        if (sketch_el instanceof ConnectedComponent){
            this.delete_element_from_data(sketch_el);
            this._guard_sketch_elements_in_sketch(sketch_el.root_el);

            /*sketch_el.transform(p => {
                this.remove_point(p);
            });*/

            const pts = sketch_el.points();
            return this.remove_points(...pts);

            return;

            // const pts = sketch_el.points();
            //return this.remove_points(...pts);
        }

        this._guard_sketch_elements_in_sketch(sketch_el);
        return this.remove_points(...ConnectedComponent(sketch_el).points());
    }

    get_connected_components(){
        const components = [];
        const visited_points = [];
        for (const p of this.points){
            if (!visited_points.includes(p)){
                const new_component = ConnectedComponent(p);
                components.push(new_component);
                visited_points.push(...new_component.points());
            }
        }

        return components;
    }

    line_between_points(pt1, pt2, file = null){
        // Makes a straight line between pt1, pt2
        this._guard_points_in_sketch(pt1, pt2);

        if (file == null){
            const l = new StraightLine(pt1, pt2, this.sample_density);
            l.set_color(interpolate_colors(pt1.get_color(), pt2.get_color(), 0.5));
            this.lines.push(l);
            return l;
        } else {
            throw new Error("Unimplemented!");
        }
    }

    line_from_function_graph(pt1, pt2, f_1, f_2 = null){
        // if one function is given, draw its graph
        // if two functiosn are given, treat them as x(t) and y(t) as t goes from 0 to 1

        // The first fn point (0, f(0)), (x(0), y(0)) will be identified with pt1 and last (1, f(1)),(x(1), y(1)) with pt2

        let x_t;
        let y_t;

        if (f_2 == null){
            x_t = (t) => t;
            y_t = f_1;
        } else {
            x_t = f_1;
            y_t = f_2;
        }

        const n = Math.ceil(1 / this.sample_density);

        const sample_points = Array.from(
            { length: n + 1 },
            (_, i) => new Vector(x_t(i/n), y_t(i/n))
        );

        const transform_src = [
            sample_points[0], sample_points[sample_points.length - 1]
        ];

        const transform_target = [
            new Vector(0,0), new Vector(1, 0)
        ];

        const transform = affine_transform_from_input_output(
            transform_src,
            transform_target
        );

        return this._line_between_points_from_sample_points(pt1, pt2, sample_points.map(transform));
    }

    _line_between_points_from_sample_points(pt1, pt2, sp){
        this._guard_points_in_sketch(pt1, pt2);

        const l = new Line(pt1, pt2, sp);
        this.lines.push(l);
        return l;
    }

    _line_between_points_from_abs_sample_points(pt1, pt2, sp){
        this._guard_points_in_sketch(pt1, pt2);

        const to_rel_fun = affine_transform_from_input_output(
            [pt1,  pt2],
            [new Vector(0,0), new Vector(1,0)]
        );

        return this._line_between_points_from_sample_points(pt1, pt2, sp.map(to_rel_fun));
    }

    interpolate_lines(line1, line2, direction = 0, f = (x) => x, p1 = (x) => x, p2 = (x) => x){
        // Interpoliert line1 und line2.
        // p1 und p2 geben zu jedem Zeitpunkt t an, wo wir uns auf den jeweiligen Linien befinden
        //      bevorzugt p_i(0) = 0 und p_i(1) = 1
        // f gibt an, wie viel von p_1, wie viel von p_2
        //      annahme: f(0) = 0 => wir sind bei Punkt 1 von Linie 1
        //               f(1) = 1 => wir sind bei Punkt 2 von Linie 2
        // direction 0-3: ändert welche Punkte jeweils als Start-/Endpunkte gewählt werden sollen (1 bis 4)

        this._guard_lines_in_sketch(line1, line2);

        function avg_point(sample_points, position){
            // position is a number between 0 and 1
            const len = sample_points.length;
            const index = position * (len - 1);

            if (Math.floor(index) == Math.ceil(index)){
                return sample_points[index];
            }

            let left_space  = index - Math.floor(index);
            let right_space = Math.ceil(index) - index;

            const p_left  = sample_points[Math.floor(index)].mult(right_space);
            const p_right = sample_points[Math.ceil(index)].mult(left_space);

            return p_left.add(p_right);
        }

        if (direction == 1 || direction == 3){
            line1.swap_orientation();
        }

        if (direction == 2 || direction == 3){
            line2.swap_orientation();
        }

        let [endpoint_L11, endpoint_L12] = line1.get_endpoints();
        let [endpoint_L21, endpoint_L22] = line2.get_endpoints();

        let start = endpoint_L11;
        let end   = endpoint_L22;

        const abs_to_rel = affine_transform_from_input_output(
            [start,  end],
            [new Vector(0,0), new Vector(1,0)]
        );

        const n = Math.ceil(1/this.sample_density); // line segments of new line
        const k = Math.ceil(1/CONF.INTERPOLATION_NORMALIZATION_DENSITY); // line segments of old lines auf Bogenlänge

        const line1_normalized = line1.abs_normalized_sample_points(k);
        const line2_normalized = line2.abs_normalized_sample_points(k);

        const sample_points = Array.from({ length: n + 1 }, (v, i) => {
            const t = i/n;

            const avg_1_target_coord = abs_to_rel(avg_point(line1_normalized, p1(t)));
            const avg_2_target_coord = abs_to_rel(avg_point(line2_normalized, p2(t)));
            const f_t = f(t);

            return avg_1_target_coord.mult(1 - f_t)
                    .add(avg_2_target_coord.mult(f_t))
        });

        if (direction == 1 || direction == 3){
            line1.swap_orientation();
        }

        if (direction == 2 || direction == 3){
            line2.swap_orientation();
        }

        const new_line = this._line_between_points_from_sample_points(
            start,
            end,
            sample_points
        );

        new_line.set_color(interpolate_colors(line1.get_color(), line2.get_color(), 0.5));

        return new_line;
    }

    merge_lines(line1, line2, data_callback = default_data_callback){
        this._guard_lines_in_sketch(line1, line2);

        if ((line1.p2 == line2.p1 && line1.p1 == line2.p2) || (line1.p1 == line2.p1 && line1.p2 == line2.p2)){
            throw new Error("Can't merge lines with both endpoints in common.");
        } else if (line1.p1 == line2.p1){
            line1.swap_orientation();
        } else if (line1.p2 == line2.p2){
            line2.swap_orientation();
        } else if (line1.p1 == line2.p2){
            line1.swap_orientation();
            line2.swap_orientation();
        } else if (line1.p2 != line2.p1){
            throw new Error("Lines have no endpoint in common");
        }

        const abs1 = line1.get_absolute_sample_points();
        const abs2 = line2.get_absolute_sample_points();
        abs1.pop();
        const abs_total = abs1.concat(abs2);

        const t_fun = affine_transform_from_input_output(
            [line1.p1,  line2.p2],
            [new Vector(0,0), new Vector(1,0)]
        );

        const relative_points = abs_total.map(p => t_fun(p));
        const new_line = this._line_between_points_from_sample_points(
            line1.p1,
            line2.p2,
            relative_points
        );

        new_line.set_color(interpolate_colors(line1.get_color(), line2.get_color(), 0.5));

        copy_sketch_obj_data(line1, new_line, data_callback);
        copy_sketch_obj_data(line2, new_line, data_callback);

        this.remove_line(line1);
        this.remove_line(line2);
        return new_line;
    }

    merge_points(pt1, pt2, data_callback = default_data_callback){
      if (pt1.subtract(pt2).length() > 0.01){
        throw new Error("Points are not ontop each other");
      }

      copy_sketch_obj_data(pt2, pt1, data_callback);

      pt2.get_adjacent_lines().forEach(line => {
         if (line.p1 !== pt2){
            line.set_endpoints(line.p1, pt1);
         } else {
            line.set_endpoints(pt1, line.p2);
         }

      });


      this.remove_points(pt2);
      return pt1;
    }

    point_on_line(pt, line, data_callback = default_data_callback){
        const abs = line.get_absolute_sample_points();

        let closest_line_segment_first_index = 0;
        let closest_distance                 = Infinity;
        for (let i = 0; i < abs.length - 1; i++){
            const new_dist = distance_from_line_segment([abs[i], abs[i+1]], pt);
            if (closest_distance > new_dist){
                closest_distance = new_dist;
                closest_line_segment_first_index = i;
            }
        }

        if (closest_distance > 0.1){
            throw new Error("Point not actually on line!");
        }

        const line_vector = abs[closest_line_segment_first_index+1].subtract(abs[closest_line_segment_first_index]);
        const offset_vector = line_vector.get_orthonormal().scale(-1*closest_distance); // evt. *-1;

        const splitting_pt = pt.subtract(offset_vector);

        const left_part  = abs.slice(0, closest_line_segment_first_index + 1);
        const right_part = abs.slice(closest_line_segment_first_index + 1);

        left_part.push(splitting_pt);
        right_part.unshift(splitting_pt);

        const left_to_rel_fun = affine_transform_from_input_output(
            [line.p1,  splitting_pt],
            [new Vector(0,0), new Vector(1,0)]
        );

        const right_to_rel_fun = affine_transform_from_input_output(
            [splitting_pt, line.p2],
            [new Vector(0,0), new Vector(1,0)]
        );

        const line_segments = [
            this._line_between_points_from_sample_points(line.p1, pt, left_part.map(left_to_rel_fun)),
            this._line_between_points_from_sample_points(pt, line.p2, right_part.map(right_to_rel_fun)),
        ];

        line_segments.forEach(ls => copy_sketch_obj_data(line, ls, data_callback))
        this.remove_line(line);

        return {
            line_segments,
            point: pt
        }
    }

    intersect_lines(line1, line2, assurances = { is_staight: true }){
        /*
            params assurances:
                { l2_stepsize_percent: 10, l2_stepsize_percent: 10}
                -> If you recursivelytest only on x percent of the lines, you will find all points
                { intersection_count : 5 }
                -> There are so many intersections exactly
                { is_straight: true}
                -> the first line - line1 - is straight (&& evently spaced i.e. not interpolated in strange ways)

            returns: {
                intersection_points: [],
                l1_segments: [],
                l2_segments: []
            }

            Note, that this function deletes line1 and line 2 and replaces them.
        */

        this._guard_lines_in_sketch(line1, line2);
        return _intersect_lines(this, line1, line2, assurances)
    }

    line_with_offset(line, offset, direction = 0){
        const abs_sample_points = line.offset_sample_points(offset, direction);
        const p1 = this.add_point(Point.from_vector(abs_sample_points[0]));
        const p2 = this.add_point(
            Point.from_vector(abs_sample_points[abs_sample_points.length - 1])
        );

        const ret_line = this._line_between_points_from_abs_sample_points(p1, p2, abs_sample_points);
        return {
            p1,
            p2,
            line: ret_line
        }
    }

    intersection_positions(line1, line2, assurances = { is_staight: true }){
        // see intersect_lines, only the points are returned and the sketch is unaltered
        return _intersection_positions(line1, line2, assurances);
    }

    copy_line(line, from, to, data_callback = default_data_callback){
        this._guard_points_in_sketch(from, to);
        const l = new Line(from, to, line.copy_sample_points(), line.get_color());
        this.lines.push(l);
        copy_sketch_obj_data(line, l, data_callback);
        return l;
    }

    remove_line(line){
        return this.remove_lines(line);
    }

    remove_lines(...lines){
        this._guard_lines_in_sketch(...lines);
        for (const line of lines){
            this.delete_element_from_data(line);
            line.get_endpoints().forEach(p => p.remove_line(line));
            line.p1 = null;
            line.p2 = null;
        }

        this.lines = this.lines.filter(l => !lines.includes(l));
    }

    remove_point(pt){
        return this.remove_points(pt);
    }

    remove_points(...points){
        this._guard_points_in_sketch(...points);
        for (const pt of points){
          this.delete_element_from_data(pt);
            this.remove_lines(...pt.get_adjacent_lines());

            pt.adjacent_lines = [];
        }

        this.points = this.points.filter(p => !points.includes(p));
    }

    remove(...els){
        for (const el of els){
            if (el instanceof Point){
                this.remove_point(el);
            }
            else {
                this.remove_line(el);
            }
        }
    }

    delete_element_from_data(el){
        let nesting = 0;

        function delete_el_from_data_obj(data){
            nesting++;
            if (nesting > 50){
                throw new Error("Seems like some object has loop in data structure! (Nesting > " + 50 + ")");
            }

            if (data instanceof Array){
                data.forEach((arr_entry, i) => {
                    if (arr_entry == el){
                        return data[i] = null;
                    }

                    delete_el_from_data_obj(arr_entry);
                });
                return nesting--;
            }

            if (data?.constructor === Object){
                for (const key in data){
                    if (data[key] == el){
                        data[key] = null;
                        continue;
                    }

                    delete_el_from_data_obj(data[key])
                }

                return nesting--;
            }

            nesting--;
        }

        delete_el_from_data_obj(this.data);
        this.points.forEach(p => delete_el_from_data_obj(p.data));
        this.lines.forEach(l => delete_el_from_data_obj(l.data));
    }

    clear(){
        this.points = [];
        this.lines  = [];
        this.data = {};
    }

    _guard_points_in_sketch(...pt){
        if (!this.has_points(...pt)){
            throw new Error("Points are not part of the sketch.");
        }
    }

    has_points(...pt){
        for (let i = 0; i < pt.length; i++){
            if (!this.points.includes(pt[i])) return false;
        }
        return true;
    }

    _guard_lines_in_sketch(...ls){
        if (!this.has_lines(...ls)){
            throw new Error("Lines are not part of the sketch.");
        }
    }

    has_lines(...ls){
        for (let i = 0; i < ls.length; i++){
            if (!this.lines.includes(ls[i])) return false;
        }
        return true;
    }

    has_sketch_elements(...se){
        for (let i = 0; i < se.length; i++){
            if (!this.has_lines(se[i]) && !this.has_points(se[i])) return false;
        }
        return true;
    }

    has(...se){
        return this.has_sketch_elements(...se);
    }

    _guard_sketch_elements_in_sketch(...ls){
        if (!this.has_sketch_elements(...ls)){
            throw new Error("Elements are not part of the sketch.");
        }
    }

    paste_sketch(sketch, data_callback = null, position = null){
        if (data_callback == null){
            data_callback = (target_sketch_data, src_sketch_data) => {
                return Object.assign(target_sketch_data, src_sketch_data);
            }
        }
        return copy_sketch(sketch, this, data_callback, position);
    }

    paste_connected_component(cc, position){
        return copy_connected_component(cc, this, position);
    }
}


// Add Validation
[
    // "get_bounding_box",
    "point",
    "add",
    "add_point",
    "get_points",
    "get_lines",
    // "connected_component",
    // "get_connected_components",
    "line_between_points",
    "line_from_function_graph",
    "interpolate_lines",
    "merge_line",
    "merge_points",
    "point_on_line",
    "intersect_lines",
    "line_with_offset",
    // "intersection_points",
    "copy_line",
    "remove_line",
    "remove_lines",
    "remove_point",
    "remove_points",
    // "clear",
    // "has_points",
    // "has_lines",
    // "has_sketch_elements",
    "paste_sketch",
    "paste_connected_component"
].forEach(methodName => {
    const originalMethod = Sketch.prototype[methodName];
    Sketch.prototype[methodName] = function(...args) {
        const result = originalMethod.apply(this, args);
        validate_sketch(this);
        return result;
    };
});

Sketch.prototype.validate = function(){
    validate_sketch(this);
    console.log("Validated");
};

// Add External Methods
Sketch.prototype.to_svg = function(...args) {
    return create_svg_from_sketch(this, ...args)
}

Sketch.prototype.save_as_svg = function(...args) {
    return save_as_svg(this, ...args)
}

Sketch.prototype.to_png = function(...args) {
    return create_png_from_sketch(this, ...args)
}

Sketch.prototype.save_as_png = function(...args) {
    return save_as_png(this, ...args)
}

Sketch.prototype.save_on_A4 = function(folder){
    toA4printable(this, folder);
    save_as_png(
        this,
        path.join(folder, "img.png"),
        CONF.PRINTABLE_WIDTH_CM * CONF.PX_PER_CM,
        CONF.PRINTABLE_HEIGHT_CM * CONF.PX_PER_CM,
    );
}

// Add Methods We cant put elsewhere bcs of circular imports
ConnectedComponent.prototype.to_sketch = function(position = null){
    const s = new Sketch();
    copy_connected_component(this, s, position);
    return s;
}

module.exports = { Sketch };
