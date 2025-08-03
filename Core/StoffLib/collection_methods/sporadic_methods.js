import { Vector, convex_hull } from "../geometry.js";
import { copy_sketch_element_collection } from "../copy.js";

export default (Class, set_if_not_exists) => {
    set_if_not_exists(Class, "get_bounding_box", function () {
        return BoundingBox.merge(
            ...this.get_sketch_elements().map((l) => l.get_bounding_box())
        );
    });

    set_if_not_exists(Class, "convex_hull", function () {
        const els = this.get_sketch_elements();

        return convex_hull(
            els.get_points().concat(
                els
                    .get_lines()
                    .map((l) => l.get_absolute_sample_points())
                    .flat()
            )
        );
    });

    set_if_not_exists(Class, "endpoint_hull", function () {
        const lines = this.get_lines();
        const points = this.get_points();
        lines.forEach((l) => {
            if (!points.includes(l.p1)) points.push(l.p1);
            if (!points.includes(l.p2)) points.push(l.p2);
        });
        return this.make_sketch_element_collection(lines.concat(points));
    });

    set_if_not_exists(Class, "inner_line_hull", function () {
        const lines = this.get_lines();
        const points = this.get_points();
        for (let i = 0; i < points.length; i++) {
            for (let j = i + 1; j < points.length; j++) {
                const inner_lines = points[i].common_lines(points[j]);
                for (let k = 0; k < inner_lines.length; k++) {
                    if (!lines.includes(inner_lines[k])) {
                        lines.push(inner_lines[k]);
                    }
                }
            }
        }
        return this.make_sketch_element_collection(lines.concat(points));
    });

    set_if_not_exists(Class, "to_sketch", function (position = null) {
        const s = new (this.get_sketch().constructor)();
        copy_sketch_element_collection(this, s, position);
        return s;
    });

    set_if_not_exists(
        Class,
        "paste_to_sketch",
        function (target, position = null) {
            return copy_sketch_element_collection(this, target, position);
        }
    );

    set_if_not_exists(Class, "self_intersecting", function () {
        // Intersections without designated points
        throw new Error("Unimplemented!");
    });
};
