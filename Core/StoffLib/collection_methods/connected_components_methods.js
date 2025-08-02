// Usefull for points, lines and SketchElementCollections
export default (Class, set_if_not_exists) => {
    set_if_not_exists(
        Class,
        "connected_component",
        function (sketch_el = null) {
            const cc = this.get_connected_components();
            for (let i = 0; i < cc.length; i++) {
                if (cc[i].includes(sketch_el)) return cc[i];
            }
            throw new Error(
                "Element doesn't belong to SketchElementCollection"
            );
        }
    );

    set_if_not_exists(Class, "delete_component", function (sketch_el) {
        return this.connected_component(sketch_el).delete_sketch_elements();
    });

    set_if_not_exists(Class, "get_connected_components", function () {
        const this_se = this.to_sketch_element_collection();
        let { points, lines } = this_se.endpoint_hull().obj();

        if (points.length == 0) return [];
        const components = [];

        while (points.length > 0) {
            let currently_visiting_point = points[0];
            const visited_points = this.new_sketch_element_collection();
            const visited_lines = this.new_sketch_element_collection();
            const to_visit_points = [currently_visiting_point];

            while (to_visit_points.length > 0) {
                currently_visiting_point = to_visit_points.pop();
                if (visited_points.includes(currently_visiting_point)) continue;

                const possible_next_lines = currently_visiting_point
                    .get_adjacent_lines()
                    .get_common_lines(lines);
                for (const line of possible_next_lines) {
                    if (!visited_lines.includes(line)) {
                        visited_lines.push(line);
                        to_visit_points.push(...line.get_endpoints());
                    }
                }
                visited_points.push(currently_visiting_point);
            }

            components.push(visited_points.concat(visited_lines));
            points = points.filter((p) => !visited_points.includes(p));
        }

        return components.map((c) => new ConnectedComponent(c[0]));
    });
};
