import { Vector, affine_transform_from_input_output, distance_from_line_segment, UP } from '../geometry.js';
import { intersect_lines, intersection_positions } from '../unicorns/intersect_lines.js';
import { default_data_callback, copy_data_callback, copy_sketch_obj_data } from '../copy.js';
import { StraightLine, Line } from '../line.js';
import { Point } from '../point.js';
import { interpolate_colors } from '../colors.js';
import line_with_length from '../unicorns/line_with_length.js';
import CONF from '../config.json' assert { type: 'json' };

export default (Sketch) => {
    Sketch.prototype.line_between_points = function(pt1, pt2){
        // Makes a straight line between pt1, pt2
        this._guard_points_in_sketch(pt1, pt2);

        const l = new StraightLine(pt1, pt2, this.sample_density);
        l.set_color(interpolate_colors(pt1.get_color(), pt2.get_color(), 0.5));
        this.lines.push(l);
        l.set_sketch(this);
        return l;
    }

    Sketch.prototype.line_with_length = function(...args){
        return line_with_length(this, ...args);
    };

    Sketch.prototype.line_at_angle = function(point, angle, length, reference_vec = UP){
      // Rotes the vector point -> reference_vec by `angle` clockwise and creates a line in that direction

      const reference_direction = reference_vec.subtract(point)
      const vec = reference_direction.to_len(length).rotate(angle);
      const newPt = point.add(vec);

      const new_pt = this.add_point(point.add(vec));
      const line = this.line_between_points(point, new_pt);
      return {
          line: line,
          other_endpoint: new_pt
      };
    };

    Sketch.prototype.line_from_function_graph = function(pt1, pt2, f_1, f_2 = null){
        // if one function is given:
        //     if it returns float: draw its graph
        //     if it returns [float, float]: draw parametrized curve
        // if two functiosn are given, treat them as x(t) and y(t) as t goes from 0 to 1

        // The first fn point (0, f(0)), (x(0), y(0)) will be identified with pt1 and last (1, f(1)),(x(1), y(1)) with pt2

        let f = null; // [0,1] -> R x R

        if (f_2 == null){
            if (Array.isArray(f_1(0))){
                f = f_1;
            } else {
                f = (t) => {
                    return [t, f_1(t)];
                }
            }
        } else {
            f = (t) => {
                return [f_1(t), f_2(t)];
            }
        }

        const n = Math.ceil(1 / this.sample_density);

        const sample_points = Array.from(
            { length: n + 1 },
            (_, i) => new Vector(...f(i/n))
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

    Sketch.prototype.plot = function(pt1, pt2, f_1, f_2 = null){
        return this.line_from_function_graph(pt1, pt2, f_1, f_2);
    }

    Sketch.prototype._line_between_points_from_sample_points = function(pt1, pt2, sp){
        this._guard_points_in_sketch(pt1, pt2);

        const to_rel_fun = affine_transform_from_input_output(
            [sp[0],  sp[sp.length - 1]],
            [new Vector(0,0), new Vector(1,0)]
        );

        const l = new Line(pt1, pt2, sp.map(to_rel_fun));
        this.lines.push(l);
        l.set_sketch(this);
        return l;
    }

    Sketch.prototype._line_between_points_from_abs_sample_points = function(pt1, pt2, sp){
        this._guard_points_in_sketch(pt1, pt2);
        return this._line_between_points_from_sample_points(pt1, pt2, sp);
    }

    Sketch.prototype.interpolate_lines = function(line1, line2, direction = 0, f = (x) => x, p1 = (x) => x, p2 = (x) => x){
        // Interpoliert line1 und line2.
        // p1 und p2 geben zu jedem Zeitpunkt t an, wo wir uns auf den jeweiligen Linien befinden
        //      annahme: p_i(0) = 0 und p_i(1) = 1
        //      wir skalieren p_i linear, so dass das zutrifft
        // f gibt an, wie viel von p_1, wie viel von p_2
        //      annahme: f(0) = 0 => wir sind beim Punkt von Linie 1
        //               f(1) = 1 => wir sind bei Punkt von Linie 2
        //      wir transformieren f(x) linear, so dass dies zutrifft!

        // direction 0-3: ändert welche Punkte jeweils als Start-/Endpunkte gewählt werden sollen (1 bis 4)

        this._guard_lines_in_sketch(line1, line2);

        function normalize_fun(f){
            // returns a linear transformated version of f with f(0) = 0, f(1) = 1
            const f0 = f(0);
            const f1 = f(1);

            if (f0 == f1){
                throw new Error("Interpolation Function has equal endpoints");
            }

            const a = 1/(f(1) - f(0));
            const b = - a * f(0)

            return (x) => {
                return a*f(x) + b;
            }
        }

        f =  normalize_fun(f);
        p1 = normalize_fun(p1);
        p2 = normalize_fun(p2);

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

    Sketch.prototype.merge_lines = function(line1, line2, delete_join = false, data_callback = default_data_callback){
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
        new_line.data = data_callback(line1.data, line2.data);

        if (delete_join){
            this.remove_point(line1.p2);
        } else {
            this.remove_line(line1);
            this.remove_line(line2);
        }

        return new_line;
    }

    Sketch.prototype.point_on_line = function(pt, line, data_callback = copy_data_callback){
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

    Sketch.prototype.position_at_length = function(line, length, reversed = false){
        return line.position_at_length(length, reversed);
    }

    Sketch.prototype.intersect_lines = function(line1, line2){
        /*
            returns: {
                intersection_points: [],
                l1_segments: [],
                l2_segments: []
            }

            Note, that this function deletes line1 and line 2 and replaces them.
        */

        this._guard_lines_in_sketch(line1, line2);
        return intersect_lines(this, line1, line2)
    }

    Sketch.prototype.line_with_offset = function(line, offset, direction = 0){
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

    Sketch.prototype.intersection_positions = function(line1, line2){
        this._guard_lines_in_sketch(line1, line2);
        return intersection_positions(line1, line2);
    }

    Sketch.prototype.copy_line = function(line, from, to, data_callback = copy_data_callback){
        this._guard_points_in_sketch(from, to);
        const l = new Line(from, to, line.copy_sample_points(), line.get_color());
        this.lines.push(l);
        l.set_sketch(this);
        copy_sketch_obj_data(line, l, data_callback);
        return l;
    }
}
