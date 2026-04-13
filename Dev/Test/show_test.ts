import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Out } from "../lib";
import { TestCase } from "./build_tests";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const arg = process.argv[2]!;
const testDir = path.join(__dirname, "cases");
const filePath = path.join(testDir, `${arg}.ts`);

if (!fs.existsSync(filePath)) {
    console.log(
        `Test \x1b[1m${arg}.ts\x1b[0m doesn't exist. All available tests are:`,
    );

    const files = fs.readdirSync(testDir);
    const tsFiles = files.filter(
        (file) =>
            file.endsWith(".ts") &&
            fs.statSync(path.join(testDir, file)).isFile(),
    );

    tsFiles.forEach((file) => {
        console.log(`- ${file}`);
    });

    process.exit(1);
}

Out.clear();

const testExport = await import(filePath);
const test: TestCase = testExport.default;
const res = Out.run_wrapped(test);

if (res && !Array.isArray(res)) {
    Out.put(res, "~out");
}

if (Array.isArray(res)) {
    for (let i = 0; i < res.length; i++) {
        Out.put(res[i]!, "~out_" + i);
    }
}

const refDir = path.join(__dirname, "reference_output", path.parse(arg).name);

if (!fs.existsSync(refDir) || !fs.statSync(refDir).isDirectory()) {
    Out.put(new Error(`Reference output directory not found: ${refDir}`));

    process.exit(1);
}

const refFiles = fs.readdirSync(refDir);

for (const file of refFiles) {
    const ext = path.extname(file);
    if (ext === ".png" || ext === ".json") {
        const src = path.join(refDir, file);
        const new_name = file.replace("out", "~ref");
        const dest = path.join(Out.dir(), new_name);
        fs.copyFileSync(src, dest);
    }
}
