import { Vector } from './geometry.js';
import Point from './point.js';
import Line from './line.js';
import { copy_sketch, default_data_callback, copy_data_callback, copy_sketch_obj_data } from './copy.js';
import CONF from './config.json' with {type: "json"};
import SketchElementCollection from './sketch_element_collection.js';

import register_rendering_functions from "./sketch_methods/rendering_methods/register.js";
import register_CC_functions from "./sketch_methods/connected_components_methods.js";
import register_line_functions from "./sketch_methods/line_methods.js";
import register_collection_methods from "./collection_methods/index.js"

import assert from './assert.js';
import register_assert from "./assert_methods/register.js";

class Sketch{
    constructor(){
        this.sample_density = CONF.DEFAULT_SAMPLE_POINT_DENSITY;
        this.points = this.new_sketch_element_collection();
        this.lines  = this.new_sketch_element_collection();
        this.data   = {};

        if (typeof this._init !== "undefined"){
            // When class is modified externally
            this._init();
        }
    }

    point(x, y){
        const pt = new Point(x,y);
        return this.add_point(pt);
    }

    add_point(...args){
        if (args[0] instanceof Point){
            args[0].set_sketch(this);
            this.points.push(args[0]);
            return args[0];
        }

        if (args[0] instanceof Vector){
            return this.add_point(Point.from_vector(args[0]));
        }

        if (typeof args[0] == "number" && typeof args[1] == "number"){
            return this.add_point(new Point(args[0], args[1]));
        }

        throw new Error("Invalid arguments given!");
    }

    add_line(line){
        assert.IS_LINE(line);
        line.get_endpoints().forEach(p => {
            assert.HAS_SKETCH(p, this);
        });

        this.lines.push(line);
        l.set_sketch(this);
        return l;
    }

    add(...args){
        /*
            Vector  -> Point
            Point   -> Point
            x, y    -> Point

            Line    -> Line (endpoints must already be in sketch)
        */
        if (
            args[0] instanceof Point
         || args[0] instanceof Vector
         || (typeof args[0] == "number" && typeof args[1] == "number")){
            return this.add_point(...args);
        }

        if (args[0] instanceof Line){
            args[0].get_endpoints().forEach(p => {
                assert.HAS_SKETCH(p, this);
            });

            this.lines.push(args[0]);
            l.set_sketch(this);
            return l;
        }

        throw new Error("Invalid arguments given!");
    }

    get_points(){
        return this.points;
    }

    get_lines(){
        return this.lines;
    }

    get_sketch(){
        return this;
    }

    remove_line(line){
        return this.remove_lines(line);
    }

    remove_lines(...lines){
        lines.forEach(l => {
            assert.IS_LINE(l);
            assert.HAS_SKETCH(l, this);
        });

        for (const line of lines){
            this._delete_element_from_data(line);
            line.get_endpoints().forEach(p => p.remove_line(line));
            line.p1 = null;
            line.p2 = null;
            line.sketch = null;
        }

        this.lines = this.lines.filter(l => !lines.includes(l));
    }

    remove_point(pt){
        return this.remove_points(pt);
    }

    remove_points(...points){
        points.forEach(p => {
            assert.IS_POINT(p);
            assert.HAS_SKETCH(p, this);
        });

        for (const pt of points){
            this._delete_element_from_data(pt);
            this.remove_lines(...pt.get_adjacent_lines());
        }
        for (const pt of points){
            pt.sketch = null;
            pt.adjacent_lines = [];
        }

        this.points = this.points.filter(p => !points.includes(p));
    }

    remove(...els){
        const points_to_remove = [];
        const lines_to_remove  = [];

        for (let i = 0; i < els.length; i++){
            if (els[i] instanceof Point) points_to_remove.push(els[i]);
            else if (els[i] instanceof Line) lines_to_remove.push(els[i]);
            else if (els[i] instanceof ConnectedComponent){
                const { points, lines } = els[i].to_obj();
                lines_to_remove.push(...lines);
                points_to_remove.push(...points);
            } else {
                assert.THROW("Trying to remove something that is not Point/Line/ConnectedComponent from Sketch.");
            }
        }

        this.remove_lines(...lines_to_remove);
        this.remove_points(...points_to_remove);
    }

    _delete_element_from_data(el){
        let nesting = 0;
        const max_nesting = 50;

        function delete_el_from_data_obj(data){
            nesting++;
            if (nesting > max_nesting){
                throw new Error("Seems like some object has loop in data structure! (Nesting > " + max_nesting + ")");
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
        this.remove_point(...this.points);
        this.data = {};
    }

    has_points(...pt){
        for (let i = 0; i < pt.length; i++){
            assert.IS_POINT(pt[i]);
            if (!this.points.includes(pt[i])) return false;
        }
        return true;
    }

    has_lines(...ls){
        for (let i = 0; i < ls.length; i++){
            assert.IS_LINE(ls[i]);
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

    // ===============

    merge_points(pt1, pt2, data_callback = default_data_callback){
        if (pt1 == pt2) return pt1;
        assert.VEC_EQUAL(pt1, pt2);

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

    copy_point = function (point, data_callback = copy_data_callback) {
        const p = this.add_point(point.copy());
        copy_sketch_obj_data(point, p, data_callback);
        return p;
    }

    copy(el = null){
        if (el instanceof Point){
            return this.copy_point(el);
        }

        if (el instanceof Line){
            return this.copy_line(el);
        }

        const s = new this.constructor();
        s.paste_sketch(this, null, new Vector(0,0));
        return s;
    }

    paste_sketch(sketch, data_callback = null, position = null){
        if (data_callback instanceof Vector){
            position = data_callback;
            data_callback = null;
        }
        if (data_callback == null){
            data_callback = copy_data_callback
        }
        copy_sketch(sketch, this, data_callback, position);
        return this;
    }

    toString(){
        return "[Sketch]"
    }
}

Sketch.prototype.validate = function(){
    return assert.IS_VALID(this);
};

register_rendering_functions(Sketch);
register_CC_functions(Sketch);
register_line_functions(Sketch);
register_collection_methods(Sketch);

Sketch.graphical_non_pure_methods = [
    "add",
    "add_point",
    "clear",
    "copy_line",
    "delete_component",
    "get_lines",
    "get_points",
    "intersect_lines",
    "interpolate_lines",
    "line_between_points",
    "line_from_function_graph",
    "line_with_length",
    "line_at_angle",
    "line_with_offset",
    "merge_lines",
    "merge_points",
    "paste_connected_component",
    "paste_sketch",
    "plot",
    "point",
    "point_on_line",
    "remove",
    "remove_line",
    "remove_lines",
    "remove_point",
    "remove_points"
]

// Validation
Sketch.graphical_non_pure_methods.forEach(methodName => {
    const originalMethod = Sketch.prototype[methodName];
    let currently_internal = false;
    Sketch.prototype[methodName] = function(...args) {
        const was_already_internal = currently_internal;
        currently_internal = true;

        const result = originalMethod.apply(this, args);

        if (!was_already_internal) this.validate();

        currently_internal = was_already_internal;
        return result;
    };
});


Sketch.Line = Line;
Sketch.Point = Point;
Sketch.SketchElementCollection = SketchElementCollection;

// Add Dev Obj
import fs from 'fs';
import ConnectedComponent from './connected_component.js';
if (fs.existsSync("./StoffLib/dev/sketch_dev/index.js")) {
    try {
        const sketch_dev = await import("./dev/sketch_dev/index.js");
        sketch_dev.default(Sketch);
    } catch (err) {
        throw err;
    }
}

// Initializations
register_assert(Sketch);

export default Sketch;
