import { z } from "zod";
import { PatternFunction } from "./types";
import { BowlCozyPattern } from "./bowl_cozy";
import { TShirtPattern } from "./tshirt/pattern_export";
import { DebugPattern } from "./debug/index";

export const Patterns = [BowlCozyPattern, TShirtPattern, DebugPattern] as const;

export const PatternConfigSchema = z.union(
    Patterns.map((p) => p.config_schema),
);
export type PatternConfig = z.infer<typeof PatternConfigSchema>;

export function is_pattern_config(name: unknown, s: unknown): true | string {
    const pattern = Patterns.find((p) => p.name == name);
    if (!pattern) return `There doesn't exist a pattern named: ${name}`;

    const res = pattern.config_schema.safeParse(s);
    if (!res.success) {
        return res.error.message;
    }
    return true;
}

export function create_design(
    name: string,
    designData: unknown,
): Error | ReturnType<PatternFunction<any, any>> {
    const pattern = Patterns.find((p) => p.name == name);
    if (!pattern) {
        return new Error(`There doesn't exist a pattern named: ${name}`);
    }

    const config = pattern.config_schema.safeParse(designData);
    if (!config.success) {
        return config.error;
    }

    try {
        return pattern.construct(config.data as any);
    } catch (e: any) {
        return e as Error;
    }
}
