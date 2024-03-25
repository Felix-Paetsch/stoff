const { createCanvas } = require('canvas');
const { writeFileSync } = require("fs");
const { sketch_to_renderable, calculate_correct_width_height } = require("./sketch_to_renderable.js");

function create_png_from_sketch(s , width, height){
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
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.strokeStyle = point.color;
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.fill();
    };

    const drawPolyline = (polyline) => {
        ctx.beginPath();
        polyline.sample_points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.strokeStyle = polyline.color;
        ctx.strokeWidth = 1;
        ctx.stroke();
    };

    lines.forEach(drawPolyline);
    points.forEach(drawCircle);

    return canvas.toBuffer();
}

module.exports = { create_png_from_sketch, save_as_png };

function save_as_png(sketch, save_to, width, height, to_lifesize = false) {
    const pngBuffer = create_png_from_sketch(sketch, width, height, to_lifesize);
    writeFileSync(save_to, pngBuffer, (err) => {
        if (err) throw err;
        console.log('PNG file saved!');
    });
}
