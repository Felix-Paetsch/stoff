import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";
import { RenderableLine, RenderablePoint, sketch_to_renderable } from "./sketch_to_renderable.js";
import CONF from "../../config.json" with { type: "json" };
import { interpolate_colors } from "../../colors.js";
import url from "url";
import { Sketch } from "../../sketch.js";
import { get_bounding_box } from "../../collection_methods/index.js";

// Define constants
const PX_PER_CM = CONF.PX_PER_CM; // Pixels per centimeter
const PRINTABLE_WIDTH_CM = CONF.PRINTABLE_WIDTH_CM; // A4 width in centimeters
const PRINTABLE_HEIGHT_CM = CONF.PRINTABLE_HEIGHT_CM; // A4 height in centimeters
const PRINT_PADDING_CM = CONF.PRINT_PADDING_CM; // Padding for each page in centimeters

const PRINT_WIDTH_PX = PRINTABLE_WIDTH_CM * PX_PER_CM;
const PRINT_HEIGHT_PX = PRINTABLE_HEIGHT_CM * PX_PER_CM;
const PRINT_PADDING_PX = PRINT_PADDING_CM * PX_PER_CM;

const PRINT_WIDTH_WITH_PADDING = PRINT_WIDTH_PX - 2 * PRINT_PADDING_PX;
const PRINT_HEIGHT_WITH_PADDING = PRINT_HEIGHT_PX - 2 * PRINT_PADDING_PX;

function toA4printable(
    sketch: Sketch,
    folder: string
) {
    const __filename = url.fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    folder = path.join(__dirname, "../../../", folder);
    createOrEmptyFolderSync(folder);

    // Get the bounding box of the sketch
    const { width: bb_width, height: bb_height } = get_bounding_box(sketch);
    const width = bb_width * PX_PER_CM;
    const height = bb_height * PX_PER_CM;

    // Prepare the sketch for rendering
    const { points, lines } = sketch_to_renderable(
        sketch,
        width,
        height,
        false
    );

    // Calculate the number of A4 pages needed
    const pagesX = Math.ceil(width / PRINT_WIDTH_WITH_PADDING);
    const pagesY = Math.ceil(height / PRINT_HEIGHT_WITH_PADDING);

    // Create each A4 page
    for (let x = 0; x < pagesX; x++) {
        for (let y = 0; y < pagesY; y++) {
            const topLeftX = x * PRINT_WIDTH_WITH_PADDING;
            const topLeftY = y * PRINT_HEIGHT_WITH_PADDING;
            const bottomRightX = Math.min(
                (x + 1) * PRINT_WIDTH_WITH_PADDING,
                width
            );
            const bottomRightY = Math.min(
                (y + 1) * PRINT_HEIGHT_WITH_PADDING,
                height
            );

            drawA4Page(
                points,
                lines,
                { topLeftX, topLeftY, bottomRightX, bottomRightY },
                { x, y },
                folder
            );
        }
    }
}

function drawA4Page(
    points: RenderablePoint[],
    lines: RenderableLine[],
    { topLeftX, topLeftY, bottomRightX, bottomRightY }: {
        topLeftX: number,
        topLeftY: number,
        bottomRightX: number,
        bottomRightY: number
    },
    { x, y }: { x: number, y: number },
    folder: string
) {
    // Create canvas for A4 size
    const canvas = createCanvas(PRINT_WIDTH_PX, PRINT_HEIGHT_PX);
    const ctx = canvas.getContext("2d");

    // Fill background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, PRINT_WIDTH_PX, PRINT_HEIGHT_PX);

    // Function to draw a circle, shifted by topLeftX and topLeftY
    const drawCircle = (point: RenderablePoint) => {
        ctx.beginPath();
        const shiftedX = point.x - topLeftX + PRINT_PADDING_PX;
        const shiftedY = point.y - topLeftY + PRINT_PADDING_PX;
        ctx.arc(shiftedX, shiftedY, 4, 0, 2 * Math.PI);
        ctx.stroke();
        const fill = point.attributes.fill;
        ctx.fillStyle = fill;
        ctx.fill();
    };

    // Function to draw a polyline, shifted by topLeftX and topLeftY
    const drawPolyline = (polyline: RenderableLine) => {
        ctx.beginPath();
        polyline.sample_points.forEach((point, index) => {
            const shiftedX = point.x - topLeftX + PRINT_PADDING_PX;
            const shiftedY = point.y - topLeftY + PRINT_PADDING_PX;
            if (index === 0) ctx.moveTo(shiftedX, shiftedY);
            else ctx.lineTo(shiftedX, shiftedY);
        });

        const stroke = polyline.attributes.stroke;
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

        ctx.lineWidth = polyline.attributes.strokeWidth;
        ctx.stroke();
    };

    // Draw the lines and points
    lines.forEach(drawPolyline);
    points.forEach(drawCircle);

    // Draw gray rectangle as border
    ctx.strokeStyle = "gray";
    ctx.lineWidth = 2;
    ctx.strokeRect(
        PRINT_PADDING_PX,
        PRINT_PADDING_PX,
        PRINT_WIDTH_PX - 2 * PRINT_PADDING_PX,
        PRINT_HEIGHT_PX - 2 * PRINT_PADDING_PX
    );

    // Print x and y values at the top right
    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.textAlign = "right";
    ctx.fillText(
        `x: ${x + 1}, y: ${y + 1}`,
        PRINT_WIDTH_PX - PRINT_PADDING_PX - 10,
        PRINT_PADDING_PX + 20
    );

    // Save the canvas as an image
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(`${folder}/page_x_${x + 1}__y_${y + 1}.png`, buffer);
}

export { toA4printable };
function createOrEmptyFolderSync(folderPath: string) {
    if (fs.existsSync(folderPath)) {
        // Read all the files in the folder
        const files = fs.readdirSync(folderPath);

        // Remove each file in the folder
        for (const file of files) {
            const filePath = path.join(folderPath, file);

            // Remove file or directory
            if (fs.statSync(filePath).isDirectory()) {
                fs.rmdirSync(filePath, { recursive: true });
            } else {
                fs.unlinkSync(filePath);
            }
        }
    } else {
        // Create the folder if it doesn't exist
        fs.mkdirSync(folderPath);
    }
}
