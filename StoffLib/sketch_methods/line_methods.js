import { Vector, affine_transform_from_input_output, distance_from_line_segment, UP } from '../geometry.js';
import { intersect_lines, intersection_positions } from '../unicorns/intersect_lines.js';
import { default_data_callback, copy_data_callback, copy_sketch_obj_data } from '../copy.js';
import { StraightLine, Line } from '../line.js';
import Point from '../point.js';
import assert from '../assert.js';
import { interpolate_colors } from '../colors.js';
import line_with_length from '../unicorns/line_with_length.js';
import CONF from '../config.json' assert { type: 'json' };

export default (Sketch) => {
    Sketch.prototype.line_between_points = function(pt1, pt2){
        // Makes a straight line between pt1, pt2
        [pt1, pt2].forEach(p => {
            assert.IS_POINT(p);
            assert.HAS_SKETCH(p, this);
        });

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
        [pt1, pt2].forEach(p => {
            assert.IS_POINT(p);
            assert.HAS_SKETCH(p, this);
        });

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
        [pt1, pt2].forEach(p => {
            assert.IS_POINT(p);
            assert.HAS_SKETCH(p, this);
        });
        return this._line_between_points_from_sample_points(pt1, pt2, sp);
    }
    
    Sketch.prototype.interpolate_lines = function(
        line1, 
        line2, 
        direction = 0, 
        f = (x) => x, 
        p1 = (x) => x, 
        p2 = (x) => x
    ) {
        // Interpoliert line1 und line2.
        // p1 und p2 geben zu jedem Zeitpunkt t an, wo wir uns auf den jeweiligen Linien befinden
        //      annahme: p_i(0) = 0 und p_i(1) = 1
        //      wir skalieren p_i linear, so dass das zutrifft
        // f gibt an, wie viel von p_1, wie viel von p_2
        //      annahme: f(0) = 0 => wir sind beim Punkt von Linie 1
        //               f(1) = 1 => wir sind bei Punkt von Linie 2
        //      wir transformieren f(x) linear, so dass dies zutrifft!

        // direction 0-3: ändert welche Punkte jeweils als Start-/Endpunkte gewählt werden sollen (1 bis 4)

        [line1, line2].forEach(l => {
            assert.IS_LINE(l);
            assert.HAS_SKETCH(l, this);
        });
    
        // A helper to normalize a given function g so that g(0)=0 and g(1)=1
        function normalize_fun(g) {
            const g0 = g(0);
            const g1 = g(1);
            if (g0 === g1) {
                throw new Error("Interpolation Function has equal endpoints");
            }
            const a = 1 / (g1 - g0);
            const b = -a * g0;
            return function (x) {
                return a * g(x) + b;
            };
        }
    
        // Normalize f, p1, p2 only once
        const f_norm = normalize_fun(f);
        const p1_norm = normalize_fun(p1);
        const p2_norm = normalize_fun(p2);
    
        // Handle direction-based orientation changes
        let flippedLine1 = false;
        let flippedLine2 = false;
        if (direction === 1 || direction === 3) {
            line1.swap_orientation();
            flippedLine1 = true;
        }
        if (direction === 2 || direction === 3) {
            line2.swap_orientation();
            flippedLine2 = true;
        }
    
        // Get endpoints
        const [endpoint_L11, endpoint_L12] = line1.get_endpoints();
        const [endpoint_L21, endpoint_L22] = line2.get_endpoints();
    
        const start = endpoint_L11; // start of new line
        const end   = endpoint_L22; // end of new line
    
        // Precompute transformation from absolute coords to relative [0,1] coordinates along start-end
        const abs_to_rel = affine_transform_from_input_output(
            [start, end],
            [new Vector(0,0), new Vector(1,0)]
        );
    
        // Precompute n, k
        const n = Math.ceil(1 / this.sample_density);
        const k = Math.ceil(1 / CONF.INTERPOLATION_NORMALIZATION_DENSITY);
    
        // Get normalized samples of line1 and line2
        const line1_normalized = line1.abs_normalized_sample_points(k);
        const line2_normalized = line2.abs_normalized_sample_points(k);
    
        // Inline function to interpolate a point from the normalized sample points array
        // position between 0 and 1
        function interpolateFromNormalized(samples, position) {
            const len = samples.length;
            const index = position * (len - 1);
            const idxFloor = Math.floor(index);
            const idxCeil = idxFloor === len - 1 ? idxFloor : idxFloor + 1;
            const frac = index - idxFloor;
    
            if (idxFloor === idxCeil) {
                // exact index, just return the point
                return samples[idxFloor];
            }
    
            // Linear interpolation between samples[idxFloor] and samples[idxCeil]
            const s1 = samples[idxFloor];
            const s2 = samples[idxCeil];
            // Avoiding multiple vector ops: do inline
            const x = s1.x * (1 - frac) + s2.x * frac;
            const y = s1.y * (1 - frac) + s2.y * frac;
            return new Vector(x, y);
        }
    
        // Pre-allocate sample_points array
        const sample_points = new Array(n + 1);
    
        // Instead of creating multiple intermediate vectors, do minimal overhead
        for (let i = 0; i <= n; i++) {
            const t = i / n;
    
            // Evaluate p1 and p2 at t
            const pt1 = p1_norm(t);
            const pt2 = p2_norm(t);
    
            // Interpolate along line1 and line2
            const line1Point = interpolateFromNormalized(line1_normalized, pt1);
            const line2Point = interpolateFromNormalized(line2_normalized, pt2);
    
            // Transform to target coordinates
            // Assuming abs_to_rel is a simple, efficient inline transform:
            const L1_rel = abs_to_rel(line1Point);
            const L2_rel = abs_to_rel(line2Point);
    
            // Compute f(t)
            const f_t = f_norm(t);
    
            // Combine line1 and line2 points according to f(t)
            const x = L1_rel.x * (1 - f_t) + L2_rel.x * f_t;
            const y = L1_rel.y * (1 - f_t) + L2_rel.y * f_t;
    
            sample_points[i] = new Vector(x, y);
        }
    
        // Restore line orientation if changed
        if (flippedLine1) {
            line1.swap_orientation();
        }
        if (flippedLine2) {
            line2.swap_orientation();
        }
    
        // Create the new line
        const new_line = this._line_between_points_from_sample_points(
            start,
            end,
            sample_points
        );
    
        new_line.set_color(interpolate_colors(line1.get_color(), line2.get_color(), 0.5));
        return new_line;
    };    

    Sketch.prototype.merge_lines = function(line1, line2, delete_join = false, data_callback = default_data_callback){
        [line1, line2].forEach(l => {
            assert.IS_LINE(l);
            assert.HAS_SKETCH(l, this);
        });

        const [old_p1, old_p2] = line1.get_endpoints();
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
        new_line.data = data_callback(line1.data, line2.data, line1, line2);

        if (delete_join){
            this.remove_point(line1.p2);
        } else {
            this.remove_line(line1);
            this.remove_line(line2);
        }

        // Make sure we take orientation from line 1
        if (new_line.p1 == old_p2 || new_line.p2 == old_p1){
            new_line.swap_orientation();
        }
        return new_line;
    }

    Sketch.prototype.point_on_line = function(pt, line, data_callback = copy_data_callback){
        if (!(pt instanceof Point)){
            pt = this.add(pt);
        }
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

    Sketch.prototype.split_line_at_length = function(line, length, data_callback = copy_data_callback, reversed = false){
        const position = line.position_at_length(length, reversed);
        const pt = this.add(position);
        return this.point_on_line(pt, line, data_callback);
    }

    Sketch.prototype.split_line_at_fraction = function(line, fraction, data_callback = copy_data_callback, reversed = false){
        const position = line.position_at_fraction(fraction, reversed);
        const pt = this.add(position);
        return this.point_on_line(pt, line, data_callback);
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

        [line1, line2].forEach(l => {
            assert.IS_LINE(l);
            assert.HAS_SKETCH(l, this);
        });
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
        [line1, line2].forEach(l => {
            assert.IS_LINE(l);
            assert.HAS_SKETCH(l, this);
        });
        return intersection_positions(line1, line2);
    }

    Sketch.prototype.copy_line = function(line, from = null, to = null, data_callback = copy_data_callback){
        if (from == null){
            from = line.p1;
            to = line.p2;
        }
        [from, to].forEach(p => {
            assert.IS_POINT(p);
            assert.HAS_SKETCH(p, this);
        });
        const l = new Line(from, to, line.copy_sample_points(), line.get_color());
        this.lines.push(l);
        l.set_sketch(this);
        copy_sketch_obj_data(line, l, data_callback);
        return l;
    }
}
