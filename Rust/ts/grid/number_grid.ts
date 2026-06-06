import { Grid } from "Core/grid/index";
import { NumberGrid } from "Core/grid/types";
import { WASMTransmittableNumberGrid } from "Rust/exports";

export function serialize_number_grid(
    g: NumberGrid,
): WASMTransmittableNumberGrid {
    return WASMTransmittableNumberGrid.new(
        Float64Array.from(g.dimensions_ref.domain_dimensions),
        Uint32Array.from(g.dimensions_ref.lattice_dimensions),
        Float64Array.from(g.values()),
    );
}

export function deserialize_number_grid(
    g: WASMTransmittableNumberGrid,
): NumberGrid {
    let domain_dims = g.domain_dimensions();
    let lattice_dims = g.lattice_dimensions();
    let values = g.into_values();

    return Grid.from_array(
        "f64",
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
