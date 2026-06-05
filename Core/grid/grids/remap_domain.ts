import { Vector } from "@/Core/geometry";
import { Grid, GridDimensions } from "./grid";

export function remap_domain_using_iterable<T>(
    g: Grid<T>,
    new_dimensions_: Partial<GridDimensions>,
    constructor: (dims: GridDimensions, it: Iterable<T>) => Grid<T>,
): Grid<T> {
    const new_dimensions =
        g.complete_partial_subgrid_dimensions(new_dimensions_);
    const [new_w, new_h] = new_dimensions.lattice_dimensions;
    const [x, y, w, h] = new_dimensions.domain_dimensions;

    return constructor(
        new_dimensions,
        function* (this: Grid<T>) {
            for (let j = 0; j < new_h; j++) {
                const fy = new_h === 1 ? 0 : j / (new_h - 1);
                const abs_y = y + fy * h;

                for (let i = 0; i < new_w; i++) {
                    const fx = new_w === 1 ? 0 : i / (new_w - 1);
                    const abs_x = x + fx * w;
                    yield this.sample_at(new Vector(abs_x, abs_y));
                }
            }
        }.bind(g)(),
    );
}
