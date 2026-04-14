import { Json, SVG_Builder } from "@/Core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Sketch } from "../../Core/sketch/sketch";
import { Out } from "../lib";

export type SceneResult = void | string | Json | Sketch | SVG_Builder | Error;
export type Scene = () => SceneResult | SceneResult[];

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

Out.clear();

const sceneExport = await import(filePath);
const scene: Scene = sceneExport.default;
const res = Out.run_wrapped(scene);

if (res && !Array.isArray(res)) {
    Out.put(res, "~out");
}

if (Array.isArray(res)) {
    for (let i = 0; i < res.length; i++) {
        Out.put(res[i]!, "~out" + i);
    }
}
