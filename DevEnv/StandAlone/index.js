import { dirname, join } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import debug_create_design from "../Debug/debug_create_design.js";

// Get scene name from command line arguments, default to "annotation"
const sceneName = process.argv[2] || "annotation";

const design = await debug_create_design(sceneName);

const target = join(__dirname, "standAlone.png");
design.save_as_png(target, 300);
