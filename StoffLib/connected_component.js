import { Vector, ZERO } from './geometry.js';
import { copy_connected_component } from './copy.js';
import Sketch from "./sketch.js";
import assert from "./assert.js";

class ConnectedComponent{
    constructor(element){
        assert.HAS_SKETCH(element);
        this.root_el = element;
    }

    root(){
        return this.root_el;
    }

    transform(pt_fun = (_pt) => {}){
        this.points().forEach(pt_fun);
        return this;
    }

    mirror(...args){
        if (args.length == 0) {
            args = [ZERO];
        }

        this.transform((pt) => pt.move_to(pt.mirror_at(...args)));
    }

    group_by_key(key){
        const { points, lines } = this.obj();
        const groupedPoints = points.reduce((acc, pt) => {
            const groupKey = pt.data[key] !== undefined ? pt.data[key] : "_";
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(pt);
            return acc;
        }, {});

        const groupedLines = lines.reduce((acc, line) => {
            const groupKey = line.data[key] !== undefined ? line.data[key] : "_";
            if (!acc[groupKey]) {
                acc[groupKey] = [];
            }
            acc[groupKey].push(line);
            return acc;
        }, {});

        return {
            points: groupedPoints,
            lines: groupedLines
        };
    }

    lines_by_key(key){
        return this.group_by_key(key).lines;
    }

    points_by_key(key){
        return this.group_by_key(key).points;
    }

    points(){
        return this.obj().points;
    }

    lines(){
        return this.obj().lines;
    }

    get_bounding_box(){
        return this.obj().bounding_box;
    }

    contains(el){
        assert.IS_SKETCH_ELEMENT(el);

        const {
            points, lines
        } = this.obj();

        return points.includes(el) || lines.includes(el)
    }

    equals(component){
        assert.IS_CONNECTED_COMPONENT(component);
        return this.contains(component.root());
    }

    obj(){
        let currently_visiting_point;
        if (this.root_el.constructor.name === "Point"){
            currently_visiting_point = this.root_el;
        } else {
            currently_visiting_point = this.root_el.p1;
        }


        const visited_points = [];
        const visited_lines  = [];
        const to_visit_points = [currently_visiting_point];

        while (to_visit_points.length > 0){
            currently_visiting_point = to_visit_points.pop();
            if (visited_points.includes(currently_visiting_point)){
                continue;
            }
            for (const line of currently_visiting_point.get_adjacent_lines()){
                if (!visited_lines.includes(line)){
                    visited_lines.push(line);
                    to_visit_points.push(
                        ...line.get_endpoints()
                    );
                }
            }
            visited_points.push(currently_visiting_point);
        }

        return {
            points: visited_points,
            lines: visited_lines,
            bounding_box: _calculate_bb_from_points_and_lines(
              visited_points, visited_lines
            )
        }
    }

    self_intersecting(){
        // Returns true if two lines (of the component) intersect with not marked point
        throw new Error("Unimplemented!")
    }

    to_sketch = function(position = null){
        const s = new Sketch();
        copy_connected_component(this, s, position);
        return s;
    };

    toString(){
        return "[ConnectedComponent]"
    }
}

export default ConnectedComponent;

function _calculate_bb_from_points_and_lines(points, lines){
    let _min_x = Infinity;
    let _min_y = Infinity;
    let _max_x = - Infinity;
    let _max_y = - Infinity;

    lines.forEach(l => {
        const { top_left, bottom_right } = l.get_bounding_box();

        _min_x = Math.min(top_left.x, _min_x);
        _max_x = Math.max(bottom_right.x, _max_x);
        _min_y = Math.min(top_left.y, _min_y);
        _max_y = Math.max(bottom_right.y, _max_y);
    });

    points.forEach(p => {
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
