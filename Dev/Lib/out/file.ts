import { writeFileSync } from "fs";
import path from "path";
import { dir } from "./dir";

export function file(buffer: Buffer, file_name: string) {
    writeFileSync(path.join(dir(), path.basename(file_name)), buffer);
}
