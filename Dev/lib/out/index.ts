import path from "path";
import { fileURLToPath } from "url";

export * from "./run";
export * from "./put";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, "../../Server/watch");

export function dir(): string {
    return outputDir;
}
