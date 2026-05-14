import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const outputDir = path.join(__dirname, "../../Server/watch");

export function dir(): string {
    return outputDir;
}
