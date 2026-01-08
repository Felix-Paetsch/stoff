import { createCanvas } from "canvas";
import fs from "fs";
import {
    sketch_to_renderable,
    calculate_correct_width_height,
} from "./sketch_to_renderable";
import Sketch from "../../sketch";

function create_canvas_from_sketch(
    s: Sketch,
    width: number | null = null,
    height: number | null = null
) {
    const correct_dimensions = calculate_correct_width_height(s, width, height);
    const { bb, points, lines } = sketch_to_renderable(
        s,
        correct_dimensions.width,
        correct_dimensions.height
    );

    const canvas = createCanvas(bb.width, bb.height);
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white"; // Set background color
    ctx.fillRect(0, 0, bb.width, bb.height);

    const drawCircle = (point: typeof points[number]) => {
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

    const drawPolyline = (polyline: typeof lines[number]) => {
        const stroke = polyline.attributes.stroke;
        const strokeWidth = polyline.attributes.strokeWidth;
        const opacity = polyline.attributes.opacity;

        ctx.beginPath();
        polyline.sample_points.forEach((point, index) => {
            if (index === 0) ctx.moveTo(point.x, point.y);
            else ctx.lineTo(point.x, point.y);
        });
        ctx.globalAlpha = opacity;
        if (typeof stroke == "string") {
            ctx.strokeStyle = stroke;
        } else {
            const grad = ctx.createLinearGradient(
                polyline.original_line.p1.x,
                polyline.original_line.p1.y,
                polyline.original_line.p2.x,
                polyline.original_line.p2.y
            );

            grad.addColorStop(0, stroke[0]);
            grad.addColorStop(1, stroke[0]);

            ctx.strokeStyle = grad;
        }
        ctx.lineWidth = strokeWidth;
        ctx.stroke();
        ctx.globalAlpha = 1.0; // Reset alpha to default
    };

    lines.forEach(drawPolyline);
    points.forEach(drawCircle);

    return canvas;
}

function create_png_from_sketch(
    s: Sketch,
    width: number | null = null,
    height: number | null = null
) {
    return create_canvas_from_sketch(s, width, height).toBuffer();
}

function create_jpg_from_sketch(
    s: Sketch,
    width: number | null = null,
    height: number | null = null
) {
    return create_canvas_from_sketch(s, width, height).toBuffer("image/jpeg");
}

export {
    create_png_from_sketch,
    save_as_png,
    create_jpg_from_sketch,
    save_as_jpg,
    create_canvas_from_sketch,
};

function save_as_png(
    sketch: Sketch,
    save_to: fs.PathOrFileDescriptor,
    width: number | null = null,
    height: number | null = null
) {
    const pngBuffer = create_png_from_sketch(sketch, width, height);
    fs.writeFileSync(save_to, pngBuffer);
    console.log("PNG File saved")
}

function save_as_jpg(
    sketch: Sketch,
    save_to: fs.PathOrFileDescriptor,
    width: number | null = null,
    height: number | null = null
) {
    const jpgBuffer = create_jpg_from_sketch(sketch, width, height);
    fs.writeFileSync(save_to, jpgBuffer);
    console.log("JPG File saved")
}
