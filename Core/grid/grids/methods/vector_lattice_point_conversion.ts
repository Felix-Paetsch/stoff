import { Vector } from "@/Core/geometry";
import { Interval } from "@/Core/numerics";
import {
    IntoGridDimensions,
    LatticePoint
} from "Core/grid/types";
import { into_grid_dimensions } from "./dimensions";

export function lattice_point_at_vector(
    dims: IntoGridDimensions,
    v: Vector,
): [number, number] {
    dims = into_grid_dimensions(dims);
    const [grid_x, grid_y, grid_w, grid_h] = dims.domain_dimensions;
    const [w, h] = dims.lattice_dimensions;

    const w_remap = Interval.remap([grid_x, grid_x + grid_w], [0, w - 1]);
    const h_remap = Interval.remap([grid_y, grid_y + grid_h], [0, h - 1]);

    const sx = w_remap(v.x);
    const sy = h_remap(v.y);

    return [
        Interval.clamp([0, w - 1], Math.round(sx)),
        Interval.clamp([0, h - 1], Math.round(sy)),
    ];
}

export function vector_at_lattice_point(
    dims: IntoGridDimensions,
    p: LatticePoint,
): Vector {
    dims = into_grid_dimensions(dims);

    const [grid_x, grid_y, grid_w, grid_h] = dims.domain_dimensions;
    const [w, h] = dims.lattice_dimensions;

    const w_remap = Interval.remap([0, w - 1], [grid_x, grid_x + grid_w]);
    const h_remap = Interval.remap([0, h - 1], [grid_y, grid_y + grid_h]);

    const sx = w_remap(Interval.clamp([0, w - 1], Math.round(p[0])));
    const sy = h_remap(Interval.clamp([0, h - 1], Math.round(p[1])));

    return new Vector(sx, sy);
}
