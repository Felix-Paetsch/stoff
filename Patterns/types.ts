import { Sewing } from "@/Core/Sewing/sewing"
import { Sketch } from "@/Core/StoffLib/sketch"
import { z } from "zod"

export type PatternFunction<DesignConfig, Measurements> = (design_config: DesignConfig, measurements: Measurements) => {
    result: Sketch | Sketch[] | Sewing,
    success?: true,
    data?: any
} | {
    reason?: string,
    success: false,
    data?: any
}

export type Pattern<Name extends string, DesignConfig, Measurements> = {
    name: Name,
    config_schema: z.ZodType<DesignConfig>,
    measurements_schema: z.ZodType<Measurements>,
    construct: PatternFunction<DesignConfig, Measurements>
}

export type DesignConfig<P extends Pattern<any, any, any>> =
    P extends Pattern<any, infer D, any> ? D : never

export type Measurements<P extends Pattern<any, any, any>> =
    P extends Pattern<any, any, infer M> ? M : never

export type PatternName<P extends Pattern<any, any, any>> =
    P extends Pattern<infer N, any, any> ? N : never

export function definePattern<N extends string, DC, M>(
    pattern: Pattern<N, DC, M>
) {
    return pattern;
}
