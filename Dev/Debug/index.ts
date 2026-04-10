import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Sketch } from "../../Core/sketch/sketch";
import { mkdir } from "fs/promises";
import { render_sketch } from "@/Core/sketch/rendering";
import sharp from "sharp";
import { SVG_Builder } from "@/Core/files/svg/svg_builder";

export type Scene = () =>
    | void
    | Sketch
    | SVG_Builder
    | (Sketch | SVG_Builder)[];

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const arg = process.argv[2] || "index";
const scenesDir = path.join(__dirname, "scenes");
const filePath = path.join(scenesDir, `${arg}.ts`);

if (!fs.existsSync(filePath)) {
    console.log(
        `File \x1b[1m${arg}.ts\x1b[0m doesn't exist. All available scenes are:`,
    );

    const files = fs.readdirSync(scenesDir);
    const tsFiles = files.filter(
        (file) =>
            file.endsWith(".ts") &&
            fs.statSync(path.join(scenesDir, file)).isFile(),
    );

    tsFiles.forEach((file) => {
        console.log(`- ${file}`);
    });

    process.exit(1);
}

const outputDir = path.join(__dirname, "output");

await mkdir(outputDir, { recursive: true });

const sceneExport = await import(filePath);
const scene: Scene = sceneExport.default;
const res = scene();

if (res instanceof Sketch) {
    const builder = render_sketch(res, 500, 500, 100);
    const svg = builder.svg();

    await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(outputDir, "scene.png"));
} else if (res instanceof SVG_Builder) {
    const svg = res.svg();

    await sharp(Buffer.from(svg))
        .png()
        .toFile(path.join(outputDir, "scene.png"));
}

if (Array.isArray(res)) {
    const cellSize = 500;
    const gridSize = Math.ceil(Math.sqrt(res.length));
    const canvasSize = cellSize * gridSize;
    const lineWidth = 1;

    const pngBuffers = await Promise.all(
        res.map(async (s) => {
            const builder =
                s instanceof SVG_Builder
                    ? s
                    : render_sketch(s, cellSize, cellSize, 50);
            const svg = builder.svg();

            return sharp(Buffer.from(svg)).png().toBuffer();
        }),
    );

    const composites: sharp.OverlayOptions[] = [];

    for (let i = 0; i < pngBuffers.length; i++) {
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;

        composites.push({
            input: pngBuffers[i],
            left: col * cellSize,
            top: row * cellSize,
        });
    }

    for (let i = 1; i < gridSize; i++) {
        composites.push({
            input: {
                create: {
                    width: lineWidth,
                    height: canvasSize,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 1 },
                },
            },
            left: i * cellSize - Math.floor(lineWidth / 2),
            top: 0,
        });

        composites.push({
            input: {
                create: {
                    width: canvasSize,
                    height: lineWidth,
                    channels: 4,
                    background: { r: 0, g: 0, b: 0, alpha: 1 },
                },
            },
            left: 0,
            top: i * cellSize - Math.floor(lineWidth / 2),
        });
    }

    await sharp({
        create: {
            width: canvasSize,
            height: canvasSize,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
    })
        .composite(composites)
        .png()
        .toFile(path.join(outputDir, "scene.png"));
}
