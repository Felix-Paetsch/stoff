import { Sewing } from "@/Core/Sewing/sewing"
import { Sketch } from "@/Core/StoffLib/sketch"
import { z } from "zod"

export type PatternFunction<DesignConfig, DataS = null, DataF = null> = (design_config: DesignConfig) => {
    result: Sketch | Sketch[] | Sewing,
    success?: true,
    data?: DataS
} | {
    reason?: string,
    success: false,
    data?: DataF
}

export type Pattern<Name extends string, DesignConfig, DataS = null, DataF = null> = {
    name: Name,
    config_schema: z.ZodType<DesignConfig>,
    construct: PatternFunction<DesignConfig, DataS, DataF>
}

export type DesignConfig<P extends Pattern<any, any, any>> =
    P extends Pattern<any, infer D, any> ? D : never

export type Measurements<P extends Pattern<any, any, any>> =
    P extends Pattern<any, any, infer M> ? M : never

export type PatternName<P extends Pattern<any, any, any>> =
    P extends Pattern<infer N, any, any> ? N : never

export function definePattern<N extends string, DC, DataS = null, DataF = null>(
    pattern: Pattern<N, DC, DataS, DataF>
) {
    return pattern;
}
