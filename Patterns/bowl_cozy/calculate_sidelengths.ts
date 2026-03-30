// Here could be an image in the folder which shows the things

import { pythagoras, pythagorasN } from "@/Core/StoffLib/geometry/1d";
import { BowlCozyConfig } from ".";

export type Bowl_Measurements = {
    top_sidelength: number,
    dart_base: number,
    dart_diagonal: number
}

export function calculate_sidelengths(cfg: BowlCozyConfig): Bowl_Measurements {
    const diag_bottom = pythagoras(cfg.w_bottom, cfg.w_bottom);

    // Calculating the triangle from a bottom corner to the top edge
    const h = cfg.depth;
    const d = (cfg.w_top - diag_bottom) / 2;

    // The length from top to bottom when sewn together
    const len_tb = pythagoras(d, h);

    // Länge der Abnäherbasis (/2)
    const abnäherbasis_2 = pythagorasN(len_tb, d);
    const top_sl = cfg.w_top + abnäherbasis_2 * 2;

    return {
        top_sidelength: top_sl,
        dart_base: abnäherbasis_2,
        dart_diagonal: len_tb
    }
}
