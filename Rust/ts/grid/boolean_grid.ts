import { grid_from_array } from "Core/grid/";
import { BooleanGrid } from "Core/grid/types";
import { WASMBooleanGrid } from "Rust/exports";
import { Allocations } from "../index";

export function wasm_boolean_grid(g: BooleanGrid): WASMBooleanGrid {
    return Allocations.allocate(
        WASMBooleanGrid.new(
            Uint8Array.from(g.values().map((v) => (v ? 1 : 0))),
            Float64Array.from(g.dimensions_ref.domain_dimensions),
            Uint32Array.from(g.dimensions_ref.lattice_dimensions),
        ),
    );
}

export function boolean_grid_from_wasm(g: WASMBooleanGrid): BooleanGrid {
    let domain_dims = g.domain_dimensions();
    let lattice_dims = g.lattice_dimensions();
    let values = Allocations.consume(g, (g) => g.into_values());

    return grid_from_array(
        "boolean",
        {
            lattice_dimensions: Array.from(lattice_dims) as [number, number],
            domain_dimensions: Array.from(domain_dims) as [
                number,
                number,
                number,
                number,
            ],
        },
        Array.from(values).map((v) => Math.abs(v) < 0.5),
    );
}
