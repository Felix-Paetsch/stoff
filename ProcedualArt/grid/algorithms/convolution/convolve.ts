import { GridWindow, GridWindowFunction } from "ProcedualArt/grid/grids/index";
import {
    BooleanGrid,
    InternalGrid,
    MatrixGrid,
    NumberGrid,
    Vec3Grid,
    VectorGrid,
} from "ProcedualArt/grid/types";
import { wasm_grid_convolve, WASMCompatability } from "Rust/exports";
import { ConvolutionKernel } from "./convolution_kernel";

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
        let matrix = k.matrix_ref();

        for (let y = 0; y < k.rows; y++) {
            for (let x = 0; x < k.columns; x++) {
                res = s.add(res, s.scale(w([x, y]), matrix[y]![x]!));
            }
        }
        return res;
    };
}

export function convolve(s: NumberGrid, k: ConvolutionKernel): NumberGrid;
export function convolve(s: Vec3Grid, k: ConvolutionKernel): Vec3Grid;
export function convolve(s: VectorGrid, k: ConvolutionKernel): VectorGrid;
export function convolve(s: MatrixGrid, k: ConvolutionKernel): MatrixGrid;
export function convolve(s: BooleanGrid, k: ConvolutionKernel): BooleanGrid;
export function convolve(s: InternalGrid, k: ConvolutionKernel): InternalGrid {
    const grid_ser = WASMCompatability.Grid.wasm_grid(s);
    const ker = WASMCompatability.Grid.wasm_convolution_kernel(k);
    const res = WASMCompatability.Allocations.allocate(
        WASMCompatability.Allocations.consume(ker, (ker) =>
            wasm_grid_convolve(grid_ser, ker),
        ),
    );
    WASMCompatability.Allocations.free(grid_ser);
    return WASMCompatability.Grid.grid_from_wasm(res);
}
