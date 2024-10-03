import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { sketch_to_renderable, calculate_correct_width_height } from './sketch_to_renderable.js';

function create_canvas_from_sketch(s , width, height){
    const correct_dimensions = calculate_correct_width_height(s, width, height);  
    const {
        bb,
        points,
        lines
    } = sketch_to_renderable(s, correct_dimensions.width, correct_dimensions.height);

    const canvas = createCanvas(bb.width, bb.height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white'; // Set background color
    ctx.fillRect(0, 0, bb.width, bb.height);

    const drawCircle = (point) => {
        const stroke = point.attributes.stroke;
        const radius = point.attributes.radius;
        const fill = point.attributes.fill;
        const strokeWidth = point.attributes.strokeWidth;
        const opacity = point.attributes.opacity;

        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.globalAlpha = 1.0; // Reset alpha to default
    };

    const drawPolyline = (polyline) => {
        const stroke = polyline.attributes.stroke;
        const strokeWidth = polyline.attributes.strokeWidth;
        const strokeDasharray = polyline.attributes.strokeDasharray.split(',').map(Number);
        const opacity = polyline.attributes.opacity;

        ctx.beginPath();
        polyline.sample_points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.globalAlpha = opacity;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = strokeWidth;
        ctx.setLineDash(strokeDasharray);
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash array
        ctx.globalAlpha = 1.0; // Reset alpha to default
    };

    lines.forEach(drawPolyline);
    points.forEach(drawCircle);

    return canvas;
}

function create_png_from_sketch(s , width, height){
    return create_canvas_from_sketch(s, width, height).toBuffer();
}

function create_jpg_from_sketch(s , width, height){
    return create_canvas_from_sketch(s, width, height).toBuffer('image/jpeg');
}

export { create_png_from_sketch, save_as_png, create_jpg_from_sketch, save_as_jpg, create_canvas_from_sketch  };

function save_as_png(sketch, save_to, width, height) {
    const pngBuffer = create_png_from_sketch(sketch, width, height);
    writeFileSync(save_to, pngBuffer, (err) => {
        if (err) throw err;
        console.log('PNG file saved!');
    });
}

function save_as_jpg(sketch, save_to, width, height) {
    const jpgBuffer = create_jpg_from_sketch(sketch, width, height);
    writeFileSync(save_to, jpgBuffer, (err) => {
        if (err) throw err;
        console.log('JPG file saved!');
    });
}
