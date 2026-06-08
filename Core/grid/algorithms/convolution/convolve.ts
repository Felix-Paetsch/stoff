import { Interval } from "Core/geometry/index";
import {
    GridWindow,
    GridWindowFunction,
    map_windows,
} from "Core/grid/grids/index";
import { NumberGrid, UInt8Grid } from "Core/grid/types";

export type ConvolutionKernel = number[][];
export type RModuleStructure<T> = {
    add(a: T, b: T): T;
    scale(a: T, b: number): T;
    zero: T;
};

export function general_kernel_convolution_function<T>(
    s: RModuleStructure<T>,
    k: ConvolutionKernel,
): GridWindowFunction<T, T> {
    return (w: GridWindow<T>) => {
        let res: T = s.zero;
        for (let y = 0; y < k.length; y++) {
            for (let x = 0; x < k[0]!.length; x++) {
                res = s.add(res, s.scale(w([x, y]), k[y]![x]!));
            }
        }
        return res;
    };
}

export function convolve_f64(s: NumberGrid, k: ConvolutionKernel): NumberGrid {
    return map_windows(
        "f64",
        s,
        [k[0]!.length, k.length],
        (w: GridWindow<number>) => {
            let res = 0;
            for (let y = 0; y < k.length; y++) {
                for (let x = 0; x < k[0]!.length; x++) {
                    res = res + w([x, y]) * k[y]![x]!;
                }
            }
            return res;
        },
    );
}

export function convolve_u8(s: UInt8Grid, k: ConvolutionKernel): UInt8Grid {
    return map_windows(
        "u8",
        s,
        [k[0]!.length, k.length],
        (w: GridWindow<number>) => {
            let res = 0;
            for (let y = 0; y < k.length; y++) {
                for (let x = 0; x < k[0]!.length; x++) {
                    res = Interval.clamp([0, 255], res + w([x, y]) * k[y]![x]!);
                }
            }
            return res;
        },
    );
}
