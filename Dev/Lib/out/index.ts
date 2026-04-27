import fs from "fs";
import path from "path";
import { outputDir } from "./dir";

export { prefix, put } from "./put";
export * from "./run";

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
