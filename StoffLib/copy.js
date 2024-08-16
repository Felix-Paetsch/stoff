import { Vector } from './geometry.js';
import { Point } from './point.js';
import { Line } from './line.js';
import { ConnectedComponent } from './connected_component.js';

function default_data_callback(d1, d2){
    return Object.assign(d1, d2);
}

function copy_sketch_obj_data(source, target, data_callback = default_data_callback, include_appearance = true){
    // Source: Line | Point
    // Target: Line | Point

    if (include_appearance){
        target.set_color(source.get_color());
    }
    const data_copy = dublicate_data(source.data);
    return data_callback(target.data, data_copy)
    || data_copy;
}

function copy_sketch(source, target, data_callback = default_data_callback, position = null){
    // Source: Sketch
    // Target: Sketch

    let offset;
    if (position instanceof Vector){
        const src_top_left = source.get_bounding_box().top_left;
        offset = position.subtract(src_top_left)
    } else {
        offset = new Vector(0, 0);
    }

    const {
        corresponding_point,
        corresponding_line
    } = copy_points_lines(
        source.get_points(),
        source.get_lines(),
        target,
        offset
    );

    const data_copy = dublicate_data(
        source.data,
        corresponding_point,
        corresponding_line
    );

    return  data_callback(target.data, data_copy)
            || target.data;
}

function copy_connected_component(source, target, position = null){
    // Source: ConnectedComponent
    // Target: Sketch

    const {
        points, lines, bounding_box
    } = source.obj();

    let offset;
    if (position instanceof Vector){
        const src_top_left = bounding_box.top_left;
        offset = position.subtract(src_top_left)
    } else {
        offset = new Vector(0, 0);
    }

    const {
        corresponding_point,
        corresponding_line
    } = copy_points_lines(points, lines, target, offset);

    if (source.root() instanceof Point){
        return corresponding_point(source.root()).connected_component();
    }

    return corresponding_line(source.root()).connected_component();
}

function copy_points_lines(points, lines, target_sketch, offset = new Vector(0,0)){
    // Offset will be added to all points

    const reference_array = [];

    points.forEach(pt => {
        const new_pt = target_sketch.add_point(
            pt.add(offset) // Vector
        ).set_color(pt.get_color());

        reference_array.push([
            pt,
            new_pt
        ]);
    });

    function get_corresponding_sketch_point(pt){
        for (let i = 0; i < reference_array.length; i++){
            if (reference_array[i][0] === pt){
                return reference_array[i][1];
            }
        }

        if (target_sketch.get_points().includes(pt)){
            return pt;
        }

        throw new Error("Data attribute contains point not in the sketch")
    }

    lines.forEach(line => {
        const endpoint_1 = get_corresponding_sketch_point(line.p1);
        const endpoint_2 = get_corresponding_sketch_point(line.p2);
        const new_line = target_sketch._line_between_points_from_sample_points(
            endpoint_1,
            endpoint_2,
            line.copy_sample_points()
        ).set_color(line.get_color());

        reference_array.push([
            line,
            new_line
        ]);
    });

    function get_corresponding_sketch_line(line){
        for (let i = 0; i < reference_array.length; i++){
            if (reference_array[i][0] === line){
                return reference_array[i][1];
            }
        }

        if (target_sketch.get_lines().includes(line)){
            return line;
        }

        throw new Error("Data attribute contains line not in the sketch")
    }

    for (const [original, copy] of reference_array){
        const data_copy = dublicate_data(
            original.data,
            get_corresponding_sketch_point,
            get_corresponding_sketch_line
        );

        Object.assign(copy.data, data_copy);
    }

    return {
        corresponding_point: get_corresponding_sketch_point,
        corresponding_line: get_corresponding_sketch_line
    }
}

export {
    copy_sketch_obj_data,
    copy_connected_component,
    copy_sketch,
    default_data_callback
}

function dublicate_data(data, get_point_reference = (pt) => pt, get_line_reference = (ln) => ln){
    let nesting = 0;    return nesting_buffer(data);
    function nesting_buffer(data){
        nesting++;
        if (nesting > 50){
            throw new Error("Can't create deep copy of data for source sketch! (Nesting > " + 50 + ")");
        }

        // Basic Stuff
        if ([
            "undefined",
            "boolean",
            "number",
            "bigint",
            "string",
            "symbol"
        ].includes(typeof data)){
            nesting--;
            return data;
        }

        // Arrays
        if (data instanceof Array){
            nesting--;
            return data.map(nesting_buffer);
        }

        if (!data){
            return data;
        }

        // Basic dicts
        if (data.constructor === Object){
            const new_data = {};
            for (const key in data){
                new_data[key] = nesting_buffer(data[key])
            }
            nesting--;
            return new_data;
        }

        // Points
        if (data instanceof Point){
            nesting--;
            return get_point_reference(data);
        }

        // Vectors
        if (data instanceof Vector){
            nesting--;
            return data;
        }

        // Lines
        if (data instanceof Line){
            nesting--;
            return get_line_reference(data);
        }

        if (data instanceof ConnectedComponent){
            const root = data.root_el;
            if (root instanceof Point){
                return new ConnectedComponent(
                    get_point_reference(root)
                );
            }

            return new ConnectedComponent(
                get_line_reference(root)
            );
        }

        throw new Error("Can't create deep copy of data for source sketch! (Invalid data type)");
    }
}
