import { z } from "zod";
import { definePattern } from "../types";

import line_with_length from "./scenes/line_with_length";

const SceneMap = {
    line_with_length: line_with_length,
} as const;

export const DebugConfigSchema = z.object({
    scene: z.enum(Object.keys(SceneMap) as [keyof typeof SceneMap]),
});

export type DebugConfig = z.infer<typeof DebugConfigSchema>;
export const DebugPattern = definePattern({
    name: "Debug",
    config_schema: DebugConfigSchema,
    construct: (cfg: DebugConfig) => {
        return {
            result: SceneMap[cfg.scene](),
        };
    },
});
