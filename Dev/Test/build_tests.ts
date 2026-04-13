// Run all tests

import fs, { writeFileSync } from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { Json, render_sketch, Sketch, SVG_Builder } from "../../Core/index";

export type TestReturnResultPrimitive = Json | Sketch | SVG_Builder;
export type TestReturnResult =
    | TestReturnResultPrimitive
    | TestReturnResultPrimitive[];
export type TestCase = () => TestReturnResult;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDir = path.join(__dirname, "cases");
const files = fs.readdirSync(testDir);

const tsFiles = files.filter(
    (file) =>
        file.endsWith(".ts") && fs.statSync(path.join(testDir, file)).isFile(),
);

type TestResult = {
    file: string;
    result: Error | TestReturnResult;
};

const test_results: TestResult[] = [];

Error.stackTraceLimit = 100;
for (const file of tsFiles) {
    const testExport = await import(path.join(testDir, file));
    const test: TestCase = testExport.default;
    try {
        const res = test();
        test_results.push({
            file,
            result: res,
        });
    } catch (err: any) {
        test_results.push({
            file,
            result: err as Error,
        });
    }
}

const testOutDir = path.join(__dirname, "test_output");
fs.rmSync(testOutDir, { recursive: true, force: true });
fs.mkdirSync(testOutDir);

for (const result of test_results) {
    const out_dir = path.join(
        testOutDir,
        result.file.split(".").slice(0, -1).join("."),
    );
    fs.mkdirSync(out_dir);

    if (result.result instanceof Error) {
        fs.writeFileSync(path.join(out_dir, "error.txt"), result.result.stack!);

        continue;
    }

    if (Array.isArray(result.result)) {
        result.result.map((r, i) => to_file(r, path.join(out_dir, `out_${i}`)));
    } else {
        to_file(result.result, path.join(out_dir, "out"));
    }
}

// To is the file name without ending
async function to_file(what: TestReturnResultPrimitive, to: string) {
    if (what instanceof Sketch) {
        what = render_sketch(what, 500, 500, 30);
    }

    if (what instanceof SVG_Builder) {
        const svg = what.svg();
        const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
        writeFileSync(`${to}.png`, pngBuffer);
        return;
    }

    writeFileSync(`${to}.json`, JSON.stringify(what));
}
