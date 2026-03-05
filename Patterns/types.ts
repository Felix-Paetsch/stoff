import { Sewing } from "@/Core/Sewing/sewing"
import { Sketch } from "@/Core/StoffLib/sketch"
import { z } from "zod"

export type PatternFunction<DesignConfig, Measurements, DataS = null, DataF = null> = (design_config: DesignConfig, measurements: Measurements) => {
    result: Sketch | Sketch[] | Sewing,
    success?: true,
    data?: DataS
} | {
    reason?: string,
    success: false,
    data?: DataF
}

export type Pattern<Name extends string, DesignConfig, Measurements, DataS = null, DataF = null> = {
    name: Name,
    config_schema: z.ZodType<DesignConfig>,
    measurements_schema: z.ZodType<Measurements>,
    construct: PatternFunction<DesignConfig, Measurements, DataS, DataF>
}

export type DesignConfig<P extends Pattern<any, any, any>> =
    P extends Pattern<any, infer D, any> ? D : never

export type Measurements<P extends Pattern<any, any, any>> =
    P extends Pattern<any, any, infer M> ? M : never

export type PatternName<P extends Pattern<any, any, any>> =
    P extends Pattern<infer N, any, any> ? N : never

export function definePattern<N extends string, DC, M, DataS = null, DataF = null>(
    pattern: Pattern<N, DC, M, DataS, DataF>
) {
    return pattern;
}
