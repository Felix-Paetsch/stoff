import { Vector } from "Core/geometry/vector";
import { Grid } from "./grid";

export function from_function<GridType>(
    dimensions: [number, number, number, number],
    grid_dimensions: [number, number],
    fn: (pos: Vector) => GridType,
): Grid<GridType> {
    const [x, y, w, h] = dimensions;
    const [grid_w, grid_h] = grid_dimensions;

    const values: GridType[] = [];

    for (let j = 0; j < grid_h; j++) {
        const fy = grid_h === 1 ? 0.5 : j / (grid_h - 1);
        const abs_y = y + fy * h;

        for (let i = 0; i < grid_w; i++) {
            const fx = grid_w === 1 ? 0.5 : i / (grid_w - 1);
            const abs_x = x + fx * w;

            values.push(fn(new Vector(abs_x, abs_y)));
        }
    }

    return new Grid<GridType>(dimensions, grid_dimensions, values);
}
