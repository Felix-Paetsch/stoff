import { patternConfig } from "./config";

import { Out } from "../../Dev/lib";
import { BowlCozyPattern } from "./bowl_cozy/index";

const patterns = [BowlCozyPattern] as const;

const pattern = patterns.find((p) => p.name === patternConfig.pattern);

if (!pattern) {
    console.log(
        `Pattern "${patternConfig}" not found! All available patterns are:`,
    );
    patterns.forEach((p) => {
        console.log(`- ${p.name}`);
    });
    process.exit(1);
}

Out.clear();
const res = Out.run_wrapped(pattern.pattern, patternConfig);

if (Array.isArray(res)) {
    for (let i = 0; i < res.length; i++) {
        Out.put(res[i]!, "~out" + i);
    }
} else {
    Out.put(res, "~out");
}
