const { Vector } = require("../Geometry/geometry.js");
const { Point } = require("./point.js");

module.exports = (target_sketch, src_sketch, data_callback, position) => {
    const visited_objects = []; // (old obj, new obj)
    let nesting = 0;

    function new_sketch_point(pt){
        for (let i = 0; i < visited_objects.length; i++){
            if (visited_objects[i][0] === pt){
                return visited_objects[i][1];
            }
        }

        const new_pt = target_sketch.add_point(
            pt.add(position) // Vector
        ).set_color(pt.get_color());

        visited_objects.push([
            pt,
            new_pt
        ]);

        return new_pt;
    }

    function new_sketch_line(line){
        for (let i = 0; i < visited_objects.length; i++){
            if (visited_objects[i][0] === line){
                return visited_objects[i][1];
            }
        }

        const endpoint_1 = new_sketch_point(line.p1);
        const endpoint_2 = new_sketch_point(line.p2);
        const new_line = target_sketch._line_between_points_from_sample_points(
            endpoint_1,
            endpoint_2,
            line.copy_sample_points()
        ).set_color(line.get_color());

        visited_objects.push([
            line,
            new_line
        ]);

        return new_line;
    }

    function deep_copy(data){
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
            return data.map(deep_copy);
        }

        // Basic dicts
        if (data.constructor === Object){
            const new_data = {};
            for (const key in data){
                new_data[key] = deep_copy(data[key])
            }
            nesting--;
            return new_data;
        }

        // Points
        if (data instanceof Point){
            nesting--;
            return new_sketch_point(data);
        }

        // Vectors
        if (data instanceof Vector){
            nesting--;
            return data;
        }

        // Lines
        if (data instanceof Line){
            nesting--;
            return new_sketch_line(data);
        }

        throw new Error("Can't create deep copy of data for source sketch! (Invalid data type)");
    }

    const data_copy = deep_copy(src_sketch.data);

    src_sketch.get_points().forEach(new_sketch_point);
    src_sketch.get_lines().forEach(new_sketch_line);

    return  data_callback(target_sketch.data, data_copy)
            || target_sketch.data;
}