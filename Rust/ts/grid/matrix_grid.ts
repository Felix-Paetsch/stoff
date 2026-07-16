import { grid_from_array } from "Core/grid/";
import { MatrixGrid } from "Core/grid/types";
import { WASMMatrixGrid, WASMVectorGrid } from "Rust/exports";
import { matrix_vec_from_wasm, wasm_matrix_vec } from "../geometry/matrix";
import { Allocations } from "../index";

export function wasm_matrix_grid(g: MatrixGrid): WASMMatrixGrid {
    return Allocations.consume(wasm_matrix_vec(g.values()), (v) => {
        return WASMVectorGrid.new(
            v,
            Float64Array.from(g.dimensions_ref.domain_dimensions),
            Uint32Array.from(g.dimensions_ref.lattice_dimensions),
        );
    });
}

export function matrix_grid_from_wasm(g: WASMMatrixGrid): MatrixGrid {
    let domain_dims = g.domain_dimensions();
    let lattice_dims = g.lattice_dimensions();
    let values = matrix_vec_from_wasm(
        Allocations.convert(g, (g) => g.into_values()),
    );

    return grid_from_array(
        "matrix",
        {
            lattice_dimensions: Array.from(lattice_dims) as [number, number],
            domain_dimensions: Array.from(domain_dims) as [
                number,
                number,
                number,
                number,
            ],
        },
        Array.from(values),
    );
}
