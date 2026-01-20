import { is_pattern_config as is_pattern_config_wo_pattern_name } from "@/Patterns/patterns";

export function is_pattern_config_with_pattern_name(obj: unknown): true | string {
    if (
        typeof obj !== "object" ||
        obj === null ||
        typeof (obj as any).pattern_name !== "string"
    ) {
        return `You need to specify an object with the "pattern_name" key.`;
    }

    return is_pattern_config_wo_pattern_name(
        (obj as any).pattern_name,
        obj
    )
}

