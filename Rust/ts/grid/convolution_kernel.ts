import { ConvolutionKernel } from "Core/grid/algorithms/convolution/convolution_kernel";
import { WASMConvolutionKernel } from "Rust/exports";
import { Allocations } from "../index";

export function wasm_convolution_kernel(
    k: ConvolutionKernel,
): WASMConvolutionKernel {
    return Allocations.allocate(
        WASMConvolutionKernel.new(
            k.columns,
            k.rows,
            new Float64Array(k.matrix_ref().flat()),
        ),
    );
}
