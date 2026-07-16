import { grid_from_array } from "Core/grid/";
import { Vec3, Vec3Grid } from "Core/grid/types";
import { WASMVec3Float64Grid, WASMVec3u8Grid } from "Rust/exports";
import { Allocations } from "../index";

export function wasm_vec3_grid(g: Vec3Grid): WASMVec3Float64Grid {
    return Allocations.allocate(
        WASMVec3Float64Grid.new(
            Float64Array.from(g.values().flat()),
            Float64Array.from(g.dimensions_ref.domain_dimensions),
            Uint32Array.from(g.dimensions_ref.lattice_dimensions),
        ),
    );
}

export function vec3_grid_from_wasm(g: WASMVec3Float64Grid): Vec3Grid {
    const domain_dims = g.domain_dimensions();
    const lattice_dims = g.lattice_dimensions();
    const values = Allocations.consume(g, (g) => g.into_values_flat());

    const values_array: Vec3[] = [];
    for (let i = 0; i < values.length; i += 3) {
        values_array.push([values[i]!, values[i + 1]!, values[i + 2]!]);
    }

    return grid_from_array(
        "vec3",
        {
            lattice_dimensions: Array.from(lattice_dims) as [number, number],
            domain_dimensions: Array.from(domain_dims) as [
                number,
                number,
                number,
                number,
            ],
        },
        Array.from(values_array),
    );
}

export function wasm_vec3u8_grid(g: Vec3Grid): WASMVec3u8Grid {
    return Allocations.allocate(
        WASMVec3u8Grid.new(
            Uint8Array.from(g.values().flat()),
            Float64Array.from(g.dimensions_ref.domain_dimensions),
            Uint32Array.from(g.dimensions_ref.lattice_dimensions),
        ),
    );
}

export function vec3_grid_from_wasm_vec3u8_grid(g: WASMVec3u8Grid): Vec3Grid {
    const domain_dims = g.domain_dimensions();
    const lattice_dims = g.lattice_dimensions();
    const values = Allocations.consume(g, (g) => g.into_values_flat());

    const values_array: Vec3[] = [];
    for (let i = 0; i < values.length; i += 3) {
        values_array.push([values[i]!, values[i + 1]!, values[i + 2]!]);
    }

    return grid_from_array(
        "vec3",
        {
            lattice_dimensions: Array.from(lattice_dims) as [number, number],
            domain_dimensions: Array.from(domain_dims) as [
                number,
                number,
                number,
                number,
            ],
        },
        Array.from(values_array),
    );
}
