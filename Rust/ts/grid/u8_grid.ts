import { Grid } from "Core/grid/index";
import { UInt8Grid } from "Core/grid/types";
import { WASMTransmittableU8Grid } from "Rust/exports";

export function serialize_u8_grid(g: UInt8Grid): WASMTransmittableU8Grid {
    return WASMTransmittableU8Grid.new(
        Float64Array.from(g.dimensions_ref.domain_dimensions),
        Uint32Array.from(g.dimensions_ref.lattice_dimensions),
        Uint8Array.from(g.values()),
    );
}

export function deserialize_u8_grid(g: WASMTransmittableU8Grid): UInt8Grid {
    let domain_dims = g.domain_dimensions();
    let lattice_dims = g.lattice_dimensions();
    let values = g.into_values();

    return Grid.from_array(
        "u8",
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
