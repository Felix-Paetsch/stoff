import { Vector } from "Core/geometry/vector";
import {
    InterpolationGrid,
    number_interpolator,
    vector_interpolator,
} from "Core/grid/index";
import {
    InternalGridType,
    InternalInterpolationGridType,
} from "Core/grid/types";

export function grid_to_vecf64(g: InternalGridType): Float64Array {
    const dimensions = g.dimensions_ref;
    const [grid_w, grid_h] = g.lattice_dimensions_ref;
    const values = g.values_ref;
    const isVectorGrid = values[0] instanceof Vector;

    if (typeof values[0] == "boolean") throw new Error("unhandled yet!");

    const headerLength = 7;
    const valueLength = isVectorGrid
        ? (values as Vector[]).length * 2
        : (values as number[]).length;

    const out = new Float64Array(headerLength + valueLength);
    let i = 0;

    out[i++] = isVectorGrid ? 1 : 0;

    out[i++] = dimensions[0];
    out[i++] = dimensions[1];
    out[i++] = dimensions[2];
    out[i++] = dimensions[3];

    out[i++] = grid_w;
    out[i++] = grid_h;

    if (isVectorGrid) {
        for (const v of values as Vector[]) {
            out[i++] = v.x;
            out[i++] = v.y;
        }
    } else {
        for (const value of values as number[]) {
            out[i++] = value;
        }
    }

    return out;
}

export function vecf64_to_grid(f: Float64Array): InternalInterpolationGridType {
    const value_type = f[0]!;
    const dimensions: [number, number, number, number] = [
        f[1]!,
        f[2]!,
        f[3]!,
        f[4]!,
    ];
    const grid_dimensions: [number, number] = [f[5]!, f[6]!];

    if (value_type === 0) {
        const values = Array.from(f.subarray(7));
        return new InterpolationGrid(
            dimensions,
            grid_dimensions,
            values,
            number_interpolator(),
        );
    }

    const values_data = f.subarray(7);
    const values: Vector[] = [];

    for (let i = 0; i < values_data.length; i += 2) {
        values.push(new Vector(values_data[i]!, values_data[i + 1]!));
    }

    return new InterpolationGrid(
        dimensions,
        grid_dimensions,
        values,
        vector_interpolator(),
    );
}
