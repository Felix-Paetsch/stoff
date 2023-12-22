

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');
const sketch_to_renderable = require("./sketch_to_lines_and_points.js");

// Define constants
const PX_PER_CM = 50; // Pixels per centimeter
const A4_WIDTH_CM = 21; // A4 width in centimeters
const A4_HEIGHT_CM = 29.7; // A4 height in centimeters
const A4_PADDING_CM = 1; // Padding for each page in centimeters

const A4_WIDTH_PX = A4_WIDTH_CM * PX_PER_CM;
const A4_HEIGHT_PX = A4_HEIGHT_CM * PX_PER_CM;
const A4_PADDING_PX = A4_PADDING_CM * PX_PER_CM;

const A4_WIDTH_WITH_PADDING = A4_WIDTH_PX - 2*A4_PADDING_PX;
const A4_HEIGHT_WITH_PADDING = A4_HEIGHT_PX - 2*A4_PADDING_PX;

function toA4printable(sketch, folder) {
    folder = path.join(__dirname, "../../", folder);
    createOrEmptyFolderSync(folder);
    
    // Get the bounding box of the sketch
    const { width: bb_width, height: bb_height } = sketch.get_bounding_box();
    const width = bb_width * PX_PER_CM;
    const height = bb_height * PX_PER_CM;

    // Prepare the sketch for rendering
    const { points, lines } = sketch_to_renderable(sketch, width, height, use_padding = false);

    // Calculate the number of A4 pages needed
    const pagesX = Math.ceil(width / A4_WIDTH_WITH_PADDING);
    const pagesY = Math.ceil(height / A4_HEIGHT_WITH_PADDING);

    // Create each A4 page
    for (let x = 0; x < pagesX; x++) {
        for (let y = 0; y < pagesY; y++) {
            const topLeftX = x * A4_WIDTH_WITH_PADDING;
            const topLeftY = y * A4_HEIGHT_WITH_PADDING;
            const bottomRightX = Math.min((x + 1) * A4_WIDTH_WITH_PADDING, width);
            const bottomRightY = Math.min((y + 1) * A4_HEIGHT_WITH_PADDING, height);

            drawA4Page(points, lines, { topLeftX, topLeftY, bottomRightX, bottomRightY }, {x, y}, folder);
        }
    }
}

function drawA4Page(points, lines, { topLeftX, topLeftY, bottomRightX, bottomRightY }, { x, y }, folder) {
    // Create canvas for A4 size
    const canvas = createCanvas(A4_WIDTH_PX, A4_HEIGHT_PX);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, A4_WIDTH_PX, A4_HEIGHT_PX);

    // Function to draw a circle, shifted by topLeftX and topLeftY
    const drawCircle = (point) => {
        ctx.beginPath();
        const shiftedX = point.x - topLeftX + A4_PADDING_PX;
        const shiftedY = point.y - topLeftY + A4_PADDING_PX;
        ctx.arc(shiftedX, shiftedY, 4, 0, 2 * Math.PI);
        ctx.strokeStyle = point.color;
        ctx.stroke();
        ctx.fillStyle = 'white';
        ctx.fill();
    };

    // Function to draw a polyline, shifted by topLeftX and topLeftY
    const drawPolyline = (polyline) => {
        ctx.beginPath();
        polyline.sample_points.forEach((point, index) => {
            const shiftedX = point.x - topLeftX + A4_PADDING_PX;
            const shiftedY = point.y - topLeftY + A4_PADDING_PX;
            if (index === 0) ctx.moveTo(shiftedX, shiftedY);
            else ctx.lineTo(shiftedX, shiftedY);
        });
        ctx.strokeStyle = polyline.color;
        ctx.strokeWidth = 1;
        ctx.stroke();
    };

    // Draw the lines and points
    lines.forEach(drawPolyline);
    points.forEach(drawCircle);

    // Draw gray rectangle as border
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 2;
    ctx.strokeRect(A4_PADDING_PX, A4_PADDING_PX, A4_WIDTH_PX - 2 * A4_PADDING_PX, A4_HEIGHT_PX - 2 * A4_PADDING_PX);

    // Print x and y values at the top right
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`x: ${x + 1}, y: ${y + 1}`, A4_WIDTH_PX - A4_PADDING_PX - 10, A4_PADDING_PX + 20);


    // Save the canvas as an image
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`${folder}/page_x_${x + 1}__y_${y + 1}.png`, buffer);
}

module.exports = { toA4printable };

function createOrEmptyFolderSync(folderPath) {
    try {
        // Check if folder exists
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
    } catch (error) {
        console.error(`Error handling folder '${folderName}':`, error);
    }
}