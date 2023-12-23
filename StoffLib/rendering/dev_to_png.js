const { createCanvas, loadImage } = require('canvas');
const { writeFileSync } = require("fs");
const sketch_to_renderable = require("./dev_sketch_to_renderable.js");
const CONF = require("../config.json");

async function create_dev_png_from_sketch(sketch, width, height, graphics){
    px_per_unit = CONF.DEFAULT_PX_PER_UNIT;

    width  *= px_per_unit;
    height *= px_per_unit;

    const {
        bb,
        points,
        lines,
        img_data
    } = await sketch_to_renderable(sketch, graphics, width, height);

    const canvas = createCanvas(bb.width, bb.height);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white'; // Set background color
    ctx.fillRect(0, 0, bb.width, bb.height);

    ctx.globalAlpha = CONF.DEV_REFERENCE_IMG_OPACITY;

    for (const img of img_data) {
        const image = await loadImage(img.data);
        ctx.drawImage(image, 
            img.top_left.x, img.top_left.y, 
            img.new_dimensions.x, img.new_dimensions.y);
    }

    ctx.globalAlpha = 1;

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

module.exports = { save_as_dev_png, create_dev_png_from_sketch };

async function save_as_dev_png(sketch, save_to, width, height, graphics) {
    const pngBuffer = await create_dev_png_from_sketch(sketch, width, height, graphics);
    writeFileSync(save_to, pngBuffer, (err) => {
        if (err) throw err;
        console.log('PNG file saved!');
    });
}
