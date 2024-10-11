import { writeFileSync } from 'fs';
import { sketch_to_renderable, calculate_correct_width_height } from './sketch_to_renderable.js';

function create_svg_from_sketch(s, width = null, height = null){
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

        svgContent += `<circle cx="${ point.x }" cy="${ point.y }" r="${ radius }" stroke="${ stroke }" fill="${ fill }" opacity="${ opacity }" stroke-width="${ strokeWidth }"/>`;
    };

    const createPolyline = (polyline) => {
        const stroke = polyline.attributes.stroke;
        const strokeWidth = polyline.attributes.strokeWidth;
        const opacity = polyline.attributes.opacity;

        const pointsString = polyline.sample_points.map(point => `${point.x},${point.y}`).join(' ');


        svgContent += `<polyline points="${ pointsString }" style="fill:none; stroke: ${ stroke }; stroke-width: ${ strokeWidth }" opacity="${ opacity }"/>`;
    };
    
    lines.forEach(createPolyline);
    points.forEach(createCircle);

    svgContent += `</svg>`;

    return svgContent;
}

export { create_svg_from_sketch, save_as_svg }

function save_as_svg(sketch, save_to, width, height){
    writeFileSync(save_to, create_svg_from_sketch(sketch, width, height), (err) => {
        if (err) throw err;        console.log('SVG file saved!');
    });
}