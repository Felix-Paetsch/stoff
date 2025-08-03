import { Vector, ZERO, mirror_type } from "./geometry.js";
import {} from "./copy.js"; // Hopefully Temporary: Imports are otherwise broken
import assert from "../assert.js";
import register_collection_methods from "./collection_methods/index.js";
import { copy_sketch_element_collection } from "./copy.js";
import { BoundingBox } from "./geometry/bounding_box.js";

class ConnectedComponent {
    constructor(element) {
        assert.HAS_SKETCH(element);
        this.root_el = element;
    }

    root() {
        return this.root_el;
    }

    mirror(...args) {
        const { points, lines } = this.obj();

        if (args.length == 0) {
            args = [ZERO];
        }

        points.forEach((pt) => pt.move_to(pt.mirror_at(...args)));
        if (mirror_type(...args) == "Line") {
            lines.forEach((l) => l.mirror());
        }
    }

    group_by_key(key) {
        const { points, lines } = this.obj();
        const groupedPoints = points.reduce((acc, pt) => {
            const groupKey = pt.data[key] !== undefined ? pt.data[key] : "_";
            if (!acc[groupKey]) {
                acc[groupKey] = this.new_sketch_element_collection();
            }
            acc[groupKey].push(pt);
            return acc;
        }, {});

        const groupedLines = lines.reduce((acc, line) => {
            const groupKey =
                line.data[key] !== undefined ? line.data[key] : "_";
            if (!acc[groupKey]) {
                acc[groupKey] = this.new_sketch_element_collection();
            }
            acc[groupKey].push(line);
            return acc;
        }, {});

        return {
            points: groupedPoints,
            lines: groupedLines,
        };
    }

    lines_by_key(key) {
        return this.group_by_key(key).lines;
    }

    points_by_key(key) {
        return this.group_by_key(key).points;
    }

    get_points() {
        return this.obj().points;
    }

    get_lines() {
        return this.obj().lines;
    }

    get_sketch_elements() {
        const r = this.obj();
        return r.points.concat(r.lines);
    }

    get_sketch() {
        return this.root_el.sketch;
    }

    get_bounding_box() {
        return this.obj().bounding_box;
    }

    contains(el) {
        assert.IS_SKETCH_ELEMENT(el);

        const { points, lines } = this.obj();

        return points.includes(el) || lines.includes(el);
    }

    equals(component) {
        assert.IS_CONNECTED_COMPONENT(component);
        return this.contains(component.root());
    }

    obj() {
        let currently_visiting_point;
        if (this.root_el.constructor.name === "Point") {
            currently_visiting_point = this.root_el;
        } else {
            currently_visiting_point = this.root_el.p1;
        }

        const visited_points = this.new_sketch_element_collection();
        const visited_lines = this.new_sketch_element_collection();
        const to_visit_points = [currently_visiting_point];

        while (to_visit_points.length > 0) {
            currently_visiting_point = to_visit_points.pop();
            if (visited_points.includes(currently_visiting_point)) {
                continue;
            }
            for (const line of currently_visiting_point.get_adjacent_lines()) {
                if (!visited_lines.includes(line)) {
                    visited_lines.push(line);
                    to_visit_points.push(...line.get_endpoints());
                }
            }
            visited_points.push(currently_visiting_point);
        }

        const res = visited_points.concat(visited_lines);
        res.points = visited_points;
        res.lines = visited_lines;
        res.bounding_box = BoundingBox.from_points(
            visited_points.concat(
                visited_lines.flatMap((l) => l.get_absolute_sample_points())
            )
        );
        return res;
    }

    toString() {
        return "[ConnectedComponent]";
    }

    paste_to_sketch(target, position = null) {
        const res = copy_sketch_element_collection(this, target, position);
        return new ConnectedComponent(
            res.get_corresponding_sketch_element(this.root())
        );
    }

    connected_component() {
        return this;
    }

    get_connected_components() {
        return [this];
    }
}

register_collection_methods(ConnectedComponent);
export default ConnectedComponent;
