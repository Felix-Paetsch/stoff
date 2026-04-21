import { string_LSystem } from "Embroidery/Lib/LSystems/string/index";
import { defineEmbroidery } from "Embroidery/types";

export const LSystemProject = defineEmbroidery(
    "LSystem" as const,
    (_cfg: {}) => {
        const s = string_LSystem([
            ["F", "F+G"],
            ["G", "F-G"],
        ] as const);

        console.log(s("FF", 10));
        return [];
    },
);
