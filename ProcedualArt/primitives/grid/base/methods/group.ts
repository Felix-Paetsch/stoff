import { GridDimensions } from "ProcedualArt/primitives/grid/types";
import { Grid } from "../index";
import { lazy_with_new_dimensions } from "./dimensions";

export function group<T extends readonly unknown[]>(
    dimensions: GridDimensions,
    ...grids: { [K in keyof T]: Grid<T[K], any> }
): Grid<T, "group"> {
    const resizedGrids = grids.map((g) =>
        lazy_with_new_dimensions(dimensions, g)
    );

    const gridValues: T[] = [];
    const [w, h] = dimensions.lattice_dimensions;

    for (let x = 0; x < w; x++) {
        for (let y = 0; y < h; y++) {
            gridValues.push(
                resizedGrids.map((g) =>
                    g.value_at_lattice_point([x, y])
                ) as any as T
            );
        }
    }

    const lerp = (a: T, b: T, t: number): T => {
        return a.map((value, i) =>
            resizedGrids[i]!.lerp(value, b[i], t)
        ) as any as T;
    };

    return new Grid(dimensions, gridValues, lerp, "group");
}
