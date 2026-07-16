import { grid_from_array } from "Core/grid/";
import { NumberGrid } from "Core/grid/types";
import { WASMFloat64Grid, WASMU8Grid } from "Rust/exports";
import { Allocations } from "../index";

export function wasm_number_grid(g: NumberGrid): WASMFloat64Grid {
    return Allocations.allocate(
        WASMFloat64Grid.new(
            Float64Array.from(g.values()),
            Float64Array.from(g.dimensions_ref.domain_dimensions),
            Uint32Array.from(g.dimensions_ref.lattice_dimensions),
        ),
    );
}

export function number_grid_from_wasm(g: WASMFloat64Grid): NumberGrid {
    let domain_dims = g.domain_dimensions();
    let lattice_dims = g.lattice_dimensions();
    let values = Allocations.consume(g, (g) => g.into_values());

    return grid_from_array(
        "number",
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

export function wasm_u8_grid(g: NumberGrid): WASMU8Grid {
    return Allocations.allocate(
        WASMU8Grid.new(
            Uint8Array.from(g.values()),
            Float64Array.from(g.dimensions_ref.domain_dimensions),
            Uint32Array.from(g.dimensions_ref.lattice_dimensions),
        ),
    );
}

export function number_grid_from_wasm_u8_grid(g: WASMU8Grid): NumberGrid {
    let domain_dims = g.domain_dimensions();
    let lattice_dims = g.lattice_dimensions();
    let values = Allocations.consume(g, (g) => g.into_values());

    return grid_from_array(
        "number",
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
