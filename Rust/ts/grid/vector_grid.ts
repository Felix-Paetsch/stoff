import { grid_from_array } from "Core/grid/";
import { VectorGrid } from "Core/grid/types";
import { WASMVectorGrid } from "Rust/exports";
import { vector_vec_from_wasm, wasm_vector_vec } from "../geometry/vectors";
import { Allocations } from "../index";

export function wasm_vector_grid(g: VectorGrid): WASMVectorGrid {
    return Allocations.consume(wasm_vector_vec(g.values()), (v) => {
        return WASMVectorGrid.new(
            v,
            Float64Array.from(g.dimensions_ref.domain_dimensions),
            Uint32Array.from(g.dimensions_ref.lattice_dimensions),
        );
    });
}

export function vector_grid_from_wasm(g: WASMVectorGrid): VectorGrid {
    let domain_dims = g.domain_dimensions();
    let lattice_dims = g.lattice_dimensions();
    let values = vector_vec_from_wasm(
        Allocations.convert(g, (g) => g.into_values()),
    );

    return grid_from_array(
        "vector",
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
