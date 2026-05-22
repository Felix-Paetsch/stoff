import { Vector } from "Core/geometry/vector";
import { NumberGrid } from "Core/grid/number_grid";
import { InternalGridType } from "Core/grid/types";
import { VectorGrid } from "Core/grid/vector_grid";

export function grid_to_vecf64(g: InternalGridType): Float64Array {
    const dimensions = g.dimensions();
    const [grid_w, grid_h] = g.grid_dimensions();
    const values = g.values_by_ref();

    const isVectorGrid = values.length > 0 && values[0] instanceof Vector;

    const out: number[] = [];
    out.push(isVectorGrid ? 1 : 0);
    out.push(...dimensions);
    out.push(grid_w, grid_h);

    if (isVectorGrid) {
        for (const v of values as Vector[]) {
            out.push(v.x, v.y);
        }
    } else {
        out.push(...(values as number[]));
    }

    return new Float64Array(out);
}

export function vecf64_to_grid(f: Float64Array): InternalGridType {
    const value_type = f[0]!;
    const dimensions: [number, number, number, number] = [
        f[1]!,
        f[2]!,
        f[3]!,
        f[4]!,
    ];
    const grid_dimensions: [number, number] = [f[5]!, f[6]!];

    const values_data = Array.from(f.slice(7));

    if (value_type === 0) {
        return new NumberGrid(dimensions, grid_dimensions, values_data);
    }

    const values: Vector[] = [];
    for (let i = 0; i < values_data.length; i += 2) {
        values.push(new Vector(values_data[i]!, values_data[i + 1]!));
    }

    return new VectorGrid(dimensions, grid_dimensions, values);
}
