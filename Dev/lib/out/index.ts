import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export { prefix, put } from "./put";
export * from "./run";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, "../../Server/watch");

export function dir(): string {
    return outputDir;
}

export function clear(
    extensionsToClear: string[] = [
        ".json",
        ".txt",
        ".cjson",
        ".png",
        ".jpeg",
        ".webp",
        ".jpg",
        ".svg",
    ],
) {
    const files = fs.readdirSync(outputDir);
    files.forEach((file) => {
        const ext = path.extname(file).toLowerCase();
        if (extensionsToClear.includes(ext)) {
            fs.unlinkSync(path.join(outputDir, file));
        }
    });
}
