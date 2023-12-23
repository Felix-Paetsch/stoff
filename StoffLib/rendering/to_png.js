const { createCanvas } = require('canvas');
const { writeFileSync } = require("fs");
const sketch_to_renderable = require("./sketch_to_lines_and_points.js");
const CONF = require("../config.json");

let px_per_unit = CONF.PX_PER_CENTIMETER;

function create_png_from_sketch(sketch , width, height, to_lifesize = false){
    if (!to_lifesize && width !== true){
        px_per_unit = CONF.DEFAULT_PX_PER_UNIT;
    }

    if (typeof width == "undefined" || typeof height == "undefined"){
        const { width: bb_width, height: bb_height } = sketch.get_bounding_box(); 
        const padding = 10 * px_per_unit; // Padding in pixels
        width  = bb_width  * px_per_unit + 2 * padding;
        height = bb_height * px_per_unit + 2 * padding;
    } else {
        width  *= px_per_unit;
        height *= px_per_unit;
    }

    const {
        bb,
        points,
        lines
    } = sketch_to_renderable(sketch, width, height);

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
