import {
    BooleanGrid,
    InternalGrid,
    NumberGrid,
    Vec3,
    Vec3Grid,
    VectorGrid,
} from "@/Core/grid";
import { Vector } from "Core/geometry/vector";

export function grid_to_vecf64(g: InternalGrid): Float64Array {
    const dimensions = g.dimensions_ref.domain_dimensions;
    const [grid_w, grid_h] = g.dimensions_ref.lattice_dimensions;

    const gridConstructor = [
        [VectorGrid, 2],
        [NumberGrid, 1],
        [BooleanGrid, 0],
        [Vec3Grid, 3],
    ] as const;

    const grid_type_number = gridConstructor.findIndex(
        (c) => c[0] === g.constructor,
    );
    const value_length = gridConstructor[grid_type_number]![1];

    const headerLength = 7;
    const out = new Float64Array(
        headerLength + value_length * g.values_ref.length,
    );
    let i = 0;

    out[i++] = grid_type_number;

    out[i++] = dimensions[0];
    out[i++] = dimensions[1];
    out[i++] = dimensions[2];
    out[i++] = dimensions[3];

    out[i++] = grid_w;
    out[i++] = grid_h;

    if (g instanceof VectorGrid) {
        for (const v of g.values_ref) {
            out[i++] = v.x;
            out[i++] = v.y;
        }
    } else if (g instanceof NumberGrid) {
        for (const value of g.values_ref) {
            out[i++] = value;
        }
    } else if (g instanceof Vec3Grid) {
        for (const value of g.values_ref) {
            out[i++] = value[0];
            out[i++] = value[1];
            out[i++] = value[2];
        }
    } else {
        for (const value of g.values_ref) {
            out[i++] = value ? 1 : 0;
        }
    }

    return out;
}

export function vecf64_to_grid(f: Float64Array): InternalGrid {
    const value_type = f[0]!;
    const dimensions: [number, number, number, number] = [
        f[1]!,
        f[2]!,
        f[3]!,
        f[4]!,
    ];
    const grid_dimensions: [number, number] = [f[5]!, f[6]!];
    const values_serialized = f.subarray(7);

    if (value_type === 0) {
        let values: Vector[] = [];
        for (let i = 0; i < values_serialized.length; i += 2) {
            values.push(
                new Vector(values_serialized[i]!, values_serialized[i + 1]!),
            );
        }

        return new VectorGrid(
            {
                domain_dimensions: dimensions,
                lattice_dimensions: grid_dimensions,
            },
            values,
        );
    } else if (value_type === 1) {
        return new NumberGrid(
            {
                domain_dimensions: dimensions,
                lattice_dimensions: grid_dimensions,
            },
            Array.from(values_serialized),
        );
    } else if (value_type === 2) {
        return new BooleanGrid(
            {
                domain_dimensions: dimensions,
                lattice_dimensions: grid_dimensions,
            },
            Array.from(values_serialized).map((b) => b === 1),
        );
    }

    let values: Vec3[] = [];
    for (let i = 0; i < values_serialized.length; i += 3) {
        values.push([
            values_serialized[i]!,
            values_serialized[i + 1]!,
            values_serialized[i + 2]!,
        ]);
    }

    return new Vec3Grid(
        {
            domain_dimensions: dimensions,
            lattice_dimensions: grid_dimensions,
        },
        values,
    );
}
