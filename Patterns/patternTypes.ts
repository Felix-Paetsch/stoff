import { Sewing } from "@/Core/Sewing/sewing"
import { Sketch } from "@/Core/StoffLib/sketch"
import { TShirtPatternConfig } from "./pattern_export"

export type MeasurementsLayout = Record<string, number | boolean>;

export type BaseMeasurements = {
    over_bust_front: number
    over_bust_back: number
    belly_front: number
    belly_back: number

    shoulder_length: number
    shoulder_width: number
    bust_width: number
    under_bust: number
    bust_point_width: number
    bust_point_height: number
    shoulderblade_width: number
    shoulderblade_height: number
    waist_width: number
    waist_height: number
    shoulder_height_front: number
    shoulder_height_back: number
    center_height_front: number
    center_height_back: number
    across_front: number
    across_back: number
    diagonal_front: number
    diagonal_back: number
    side_height: number
    bottom_width_front: number
    bottom_width_back: number
    arm: number
    "arm length": number
    wristwidth: number
    ellbow_width: number
    ellbow_length: number
}

export function is_measurements(s: any): s is BaseMeasurements {
    return true;
}

export type PatternConfig = TShirtPatternConfig;
export function is_pattern_config(s: any): s is PatternConfig {
    return true;
}

export type PatternFunction<PatternName extends string, Measurements extends MeasurementsLayout = BaseMeasurements>
    = (cfg: PatternConfig & { pattern_name: PatternName }, mea: Measurements) => Sketch | Sketch[] | Sewing
