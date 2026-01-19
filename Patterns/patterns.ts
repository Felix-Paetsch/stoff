import { z } from "zod";
import { TShirtPattern } from "./tshirt/pattern_export";
import { PatternFunction } from "./types";

export const Patterns = [
    TShirtPattern
] as const;

export const PatternConfigSchema = z.union(Patterns.map(p => p.config_schema));
export type PatternConfig = z.infer<typeof PatternConfigSchema>;

export function is_pattern_config(name: unknown, s: unknown): true | string {
    const pattern = Patterns.find(p => p.name == name);
    if (!pattern) return `There doesn't exist a pattern named: ${name}`;

    const res = pattern.config_schema.safeParse(s);
    if (!res.success) {
        return res.error.message
    }
    return true;
}

export function create_design(name: string, designData: unknown, measurements: unknown): Error | ReturnType<PatternFunction<any, any>> {
    const pattern = Patterns.find(p => p.name == name);
    if (!pattern) {
        return new Error(`There doesn't exist a pattern named: ${name}`);
    }

    const config = pattern.config_schema.safeParse(designData);
    if (!config.success) {
        return config.error;
    }

    const mea = pattern.measurements_schema.safeParse(measurements);
    if (!mea.success) {
        return mea.error;
    }

    try {
        return pattern.construct(config.data, mea.data);
    } catch (e: any) {
        return e as Error;
    }
}
