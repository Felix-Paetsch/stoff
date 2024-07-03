import { sketch_to_renderable, calculate_correct_width_height } from './sketch_to_renderable.js';
import { interpolate_colors } from '../colors.js';

function create_dev_svg_from_sketch(s, width = null, height = null){
    const correct_dimensions = calculate_correct_width_height(s, width, height);
    const {
        bb,
        points,
        lines
    } = sketch_to_renderable(s, correct_dimensions.width, correct_dimensions.height);

    let svgContent = `<svg width="${ bb.width }" height="${ bb.height }" xmlns="http://www.w3.org/2000/svg">`;

    const createCircle = (point) => {
        const fill = interpolate_colors(point.color, point.color) == "rgb(0,0,0)"
            ? "white" : point.color;
        const stroke = "black";

        const point_data = data_to_serializable(point.original_point.data);
        svgContent += `<circle cx="${ point.x }" cy="${ point.y }" r="3" stroke="${ stroke }" fill="${ fill }" x-data="${
            JSON.stringify(
                point_data
            ).replace(/\\/g, '\\\\').replace(/"/g, '&quot;')
        }" hover_area/>`;
        svgContent += `<circle cx="${ point.x }" cy="${ point.y }" r="3" stroke="${ stroke }" fill="${ fill }"/>`;
    };

    const createPolyline = (polyline) => {
        const pointsString = polyline.sample_points.map(point => `${point.x},${point.y}`).join(' ');

        const line_data = data_to_serializable(polyline.original_line.data);
        line_data._length = polyline.original_line.get_length();

        // Hover area
        svgContent += `<polyline points="${ pointsString }" style="fill:none;stroke:rgba(0,0,0,0);stroke-width:8" x-data="${
            JSON.stringify(
                line_data
            ).replace(/\\/g, '\\\\').replace(/"/g, '&quot;')
        }" hover_area/>`;

        svgContent += `<polyline points="${ pointsString }" style="fill:none;stroke:${ polyline.color };stroke-width:1"/>`;
    };

    lines.forEach(createPolyline);
    points.forEach(createCircle);

    svgContent += `</svg>`;

    return svgContent;
}

export { create_dev_svg_from_sketch }

function data_to_serializable(data) {
    let nesting = 0;
    return nesting_buffer(data);

    function nesting_buffer(data){
        nesting++;
        if (nesting > 50){
            throw new Error("Can't serialize data! (Nesting > " + 50 + ")");
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
            return "<PT>";
        }

        // Vectors
        if (data instanceof Vector){
            nesting--;
            return "<VEC>";
        }

        // Lines
        if (data instanceof Line){
            nesting--;
            return "<LN>";
        }

        if (data instanceof ConnectedComponent){
            return "<CC>";
        }

        throw new Error("Can't serialize data! (Invalid data type)");
    }
}
