
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import debug_create_design from "../Debug/debug_create_design.js";

for (let i = 0; i < 1000; i++){
    const design = await debug_create_design("shirt");
}

//const target = join(__dirname, "standAlone.png");
//design.save_as_png(target, 300);