import { sketch_to_renderable, calculate_correct_width_height } from './sketch_to_renderable.js';

function create_dev_svg_from_sketch(s, width = null, height = null){
    const correct_dimensions = calculate_correct_width_height(s, width, height);
    const {
        bb,
        points,
        lines
    } = sketch_to_renderable(s, correct_dimensions.width, correct_dimensions.height);

    let svgContent = `<svg width="${ bb.width }" height="${ bb.height }" xmlns="http://www.w3.org/2000/svg">`;

    const createCircle = (point) => {
        const stroke = point.attributes.stroke;
        const radius = point.attributes.radius;
        const fill = point.attributes.fill;
        const strokeWidth = point.attributes.strokeWidth;
        const opacity = point.attributes.opacity;

        const point_data = data_to_serializable(point.original_point.data);
        if (typeof point_data === 'object') {
            point_data._x = Math.round(point.x * 1000)/1000;
            point_data._y = Math.round(point.y * 1000)/1000;
        }

        svgContent += `<circle cx="${ point.x }" cy="${ point.y }" r="${ radius }" stroke="${ stroke }" fill="${ fill }" opacity="${ opacity }" stroke-width="${ strokeWidth }" x-data="${
            JSON.stringify(
                point_data
            ).replace(/\\/g, '\\\\').replace(/"/g, '&quot;')
        }" hover_area/>`;
        svgContent += `<circle cx="${ point.x }" cy="${ point.y }" r="${ radius }" stroke="${ stroke }" fill="${ fill }" opacity="${ opacity }" stroke-width="${ strokeWidth }"/>`;
    };

    const createPolyline = (polyline) => {
        const stroke = polyline.attributes.stroke;
        const strokeWidth = polyline.attributes.strokeWidth;
        const opacity = polyline.attributes.opacity;

        const pointsString = polyline.sample_points.map(point => `${point.x},${point.y}`).join(' ');

        const line_data = data_to_serializable(polyline.original_line.data);
        if (typeof line_data === 'object') {
            line_data._length = Math.round(polyline.original_line.get_length() * 1000)/1000;
        }

        // Hover area
        svgContent += `<polyline points="${ pointsString }" style="fill:none; stroke: rgba(0,0,0,0); stroke-width: ${ Math.max(strokeWidth, 8) }" x-data="${
            JSON.stringify(
                line_data
            ).replace(/\\/g, '\\\\').replace(/"/g, '&quot;')
        }" hover_area/>`;

        svgContent += `<polyline points="${ pointsString }" style="fill:none; stroke: ${ stroke }; stroke-width: ${ strokeWidth }" opacity="${ opacity }" />`;
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

        if (typeof data == "undefined"){
            nesting--;
            return "<undefined>";
        }

        // Basic Stuff
        if ([
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
