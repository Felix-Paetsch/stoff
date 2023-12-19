const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib');

const FOLDER_PATH = "./renders/rendered_A4"

async function mergePNGsToPDF(folderPath, outputPDFPath) {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Read the .png files from the folder
    const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.png'));

    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const imageBytes = fs.readFileSync(filePath);

        // Embed the PNG image in the PDF
        const image = await pdfDoc.embedPng(imageBytes);
        const pngDims = image.scale(1);

        // Add a page for each image
        const page = pdfDoc.addPage([pngDims.width, pngDims.height]);

        // Draw the image on the page
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: pngDims.width,
            height: pngDims.height,
        });
    }

    // Write the PDF to a file
    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPDFPath, pdfBytes);

    console.log(`PDF created at: ${outputPDFPath}`);
}

// Usage
const folderPath = path.join(__dirname, '..', FOLDER_PATH);
const outputPDFPath = path.join(__dirname, '..', FOLDER_PATH, 'merged.pdf');
mergePNGsToPDF(folderPath, outputPDFPath);
