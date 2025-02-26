import { readFileSync  } from 'fs';
import { basename, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

export default (relBaseDir, relativePaths) => {
    // relBaseDir is relative to the rootDir
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const baseDir = resolve(__dirname, "../../../../../", relBaseDir);
    const assets = {};

    relativePaths.forEach(relativePath => {
        const fullPath = resolve(baseDir, relativePath);
        const fileName = basename(fullPath);
        const fileContent = readFileSync(fullPath, "utf-8");

        if (fileName.endsWith(".css")) {
            assets[fileName] = "<style>" + fileContent + "</style>";
        } else if (fileName.endsWith(".js")) {
            assets[fileName] = "<script>" + fileContent + "</script>";
        } else {
            assets[fileName] = fileContent;
        }
    });

    return assets;
};