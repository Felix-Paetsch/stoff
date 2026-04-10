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

const outputDir = await prepare_output_directory(
    path.join(__dirname, "../Server/watch"),
);

const sceneExport = await import(filePath);
const scene: Scene = sceneExport.default;
const res = scene();

if (res instanceof Sketch) {
    const builder = render_sketch(res, 500, 500, 30, true);
    const svg = builder.svg();

    fs.writeFileSync(path.join(outputDir, "output.svg"), svg);
} else if (res instanceof SVG_Builder) {
    const svg = res.svg();
    fs.writeFileSync(path.join(outputDir, "output.svg"), svg);
}

if (Array.isArray(res)) {
    for (let i = 0; i < res.length; i++) {
        const s = res[i]!;
        const builder =
            s instanceof SVG_Builder ? s : render_sketch(s, 500, 500, 30, true);
        const svg = builder.svg();

        fs.writeFileSync(path.join(outputDir, `output_${i}.svg`), svg);
    }
}

async function prepare_output_directory(outputDir: string) {
    await mkdir(outputDir, { recursive: true });

    const extensionsToClear = [
        ".json",
        ".txt",
        ".cjson",
        ".png",
        ".jpeg",
        ".webp",
        ".jpg",
        ".svg",
    ];

    const files = fs.readdirSync(outputDir);
    files.forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        if (extensionsToClear.includes(ext)) {
            fs.unlinkSync(path.join(outputDir, file));
        }
    });

    return outputDir;
}
