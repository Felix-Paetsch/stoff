import { SVG_Builder } from "@/Core/svg";
import { Json } from "@/Core/utils";
import fs from "fs";
import path from "path";
import { Embroidery } from "ProcedualArt/primitives/embroidery";
import { WASMCompatability } from "Rust/exports";
import { fileURLToPath } from "url";
import { Sketch } from "../Core/sketch/sketch";
import { Out } from "../Dev/lib";

export type SceneResult =
    | void
    | string
    | Json
    | Sketch
    | SVG_Builder
    | Error
    | Embroidery;

export type Scene = () =>
    | SceneResult
    | SceneResult[]
    | Promise<SceneResult>
    | Promise<SceneResult[]>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scenesDir = path.join(__dirname, "scenes");

const input = process.argv[2] || "index";

function formatEntryName(entry: fs.Dirent): string {
    return entry.isDirectory() ? `${entry.name}/` : entry.name;
}

function listDirectory(directory: string): void {
    const entries = fs
        .readdirSync(directory, { withFileTypes: true })
        .sort((a, b) => {
            if (a.isDirectory() !== b.isDirectory()) {
                return a.isDirectory() ? -1 : 1;
            }

            return a.name.localeCompare(b.name);
        });

    for (const entry of entries) {
        console.log(`- ${formatEntryName(entry)}`);
    }
}

function resolveScenePath(inputPath: string): string | undefined {
    const hasTsExtension = inputPath.endsWith(".ts");
    const relativePath = hasTsExtension ? inputPath : `${inputPath}.ts`;
    const candidate = path.resolve(scenesDir, relativePath);

    // Prevent paths such as "../outside.ts" from escaping the scenes directory.
    const relativeToScenes = path.relative(scenesDir, candidate);
    if (
        relativeToScenes.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativeToScenes)
    ) {
        return undefined;
    }

    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
    }

    return undefined;
}

const filePath = resolveScenePath(input);

if (!filePath) {
    const inputPath = path.resolve(scenesDir, input);
    const inputExists = fs.existsSync(inputPath);
    const inputIsDirectory =
        inputExists && fs.statSync(inputPath).isDirectory();

    if (inputIsDirectory) {
        console.log(
            `Scene file not found in directory \x1b[1m${input}\x1b[0m. ` +
                "Available items are:",
        );
        listDirectory(inputPath);
    } else {
        console.log(
            `Scene path \x1b[1m${input}\x1b[0m doesn't exist. ` +
                "Available items are:",
        );
        listDirectory(scenesDir);
    }

    process.exit(1);
}

Out.clear();

const sceneExport = await import(filePath);
const scene: Scene = sceneExport.default;
const res = await Out.run_wrapped(scene);

if (res && !Array.isArray(res)) {
    Out.put(res, "~out");
}

if (Array.isArray(res)) {
    for (let i = 0; i < res.length; i++) {
        Out.put(res[i]!, "~out" + i);
    }
}

setTimeout(() => {
    WASMCompatability.Allocations.assert_zero_allocations();
}, 1000);
