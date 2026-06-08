import { Expect } from "Core/expect";
import { Interval } from "Core/geometry/index";
import { Vector } from "Core/geometry/vector";
import { EPS } from "Core/numerics/eps";
import {
    GridDimensions,
    LatticePoint,
    PartialGridDimensions,
} from "../../types";
import { IGrid } from "../igrid";

export function dimensions_agree(
    l:
        | GridDimensions
        | {
              dimensions_ref: GridDimensions;
          },
    o:
        | GridDimensions
        | {
              dimensions_ref: GridDimensions;
          },
) {
    if ("dimensions_ref" in l) {
        l = l.dimensions_ref;
    }
    if ("dimensions_ref" in o) {
        o = o.dimensions_ref;
    }

    let ld = l.lattice_dimensions;
    let ldo = o.lattice_dimensions;

    let dd = l.domain_dimensions;
    let ddo = o.domain_dimensions;

    return (
        ld[0] == ldo[0] &&
        ld[1] == ldo[1] &&
        Math.abs(dd[0] - ddo[0]) < EPS.tiny &&
        Math.abs(dd[1] - ddo[1]) < EPS.tiny &&
        Math.abs(dd[2] - ddo[2]) < EPS.tiny &&
        Math.abs(dd[3] - ddo[3]) < EPS.tiny
    );
}

export function complete_partial_subgrid_dimensions(
    dims: PartialGridDimensions,
    g: IGrid<any, any>,
): GridDimensions {
    if (!dims) {
        dims = {};
    } else if (Array.isArray(dims)) {
        if (dims.length == 2) {
            dims = {
                lattice_dimensions: dims,
            };
        } else {
            dims = {
                domain_dimensions: dims,
            };
        }
    }

    if (!dims.domain_dimensions) {
        dims.domain_dimensions = g.dimensions_ref.domain_dimensions;
    }

    const dd = dims.domain_dimensions!;
    const tdd = g.dimensions_ref.domain_dimensions!;
    Expect.that(
        EPS.less_than_or_eq(dd[0], tdd[0]) &&
            EPS.less_than_or_eq(dd[1], tdd[1]) &&
            EPS.less_than_or_eq(dd[0] + dd[2], tdd[0] + tdd[2]) &&
            EPS.less_than_or_eq(dd[1] + dd[3], tdd[1] + tdd[3]),
        "New dimensions must be a subspace of old dimensions",
    );
    Expect.that(
        dd[2] > 0 && dd[3] > 0,
        "New dimensions must have width, height > 0",
    );

    if (!dims.lattice_dimensions) {
        let w_frac = tdd[2] / dd[2];
        let h_frac = tdd[3] / dd[3];

        dims.lattice_dimensions = [
            Math.max(
                Math.ceil(w_frac * g.dimensions_ref.lattice_dimensions[0]),
                2,
            ),
            Math.max(
                Math.ceil(h_frac * g.dimensions_ref.lattice_dimensions[1]),
                2,
            ),
        ];
    }

    return dims as GridDimensions;
}

export function lazy_with_new_dimensions<T, S extends string>(
    new_dimensions_: PartialGridDimensions,
    g: IGrid<T, S>,
): IGrid<T, S> {
    const new_dimensions = complete_partial_subgrid_dimensions(
        new_dimensions_,
        g,
    );

    if (dimensions_agree(new_dimensions, g.dimensions_ref)) {
        return g;
    }

    return g.with_new_dimensions(new_dimensions);
}

export function lattice_point_at_vector(
    dims: GridDimensions,
    v: Vector,
): [number, number] {
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
    dims: GridDimensions,
    p: LatticePoint,
): Vector {
    const [grid_x, grid_y, grid_w, grid_h] = dims.domain_dimensions;
    const [w, h] = dims.lattice_dimensions;

    const w_remap = Interval.remap([0, w - 1], [grid_x, grid_x + grid_w]);
    const h_remap = Interval.remap([0, h - 1], [grid_y, grid_y + grid_h]);

    const sx = w_remap(Interval.clamp([0, w - 1], Math.round(p[0])));
    const sy = h_remap(Interval.clamp([0, h - 1], Math.round(p[1])));

    return new Vector(sx, sy);
}
