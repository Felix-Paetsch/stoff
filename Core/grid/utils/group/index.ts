import { Expect } from "Core/expect";
import { Grid, GridDimensions } from "../../grids";
import { GroupedGrid, GroupedGridArray } from "./grouped_grid";

// Note that this doesn't copy/clone!
export function group_grids<A>(
    gA: Grid<A>,
    dims?: Partial<GridDimensions>,
): Grid<[A]>;
export function group_grids<A, B>(
    gA: Grid<A>,
    gB: Grid<B>,
    dims?: Partial<GridDimensions>,
): Grid<[A, B]>;
export function group_grids<A, B, C>(
    gA: Grid<A>,
    gB: Grid<B>,
    gC: Grid<C>,
    dims?: Partial<GridDimensions>,
): Grid<[A, B, C]>;
export function group_grids<A, B, C, D>(
    gA: Grid<A>,
    gB: Grid<B>,
    gC: Grid<C>,
    gD: Grid<D>,
    dims?: Partial<GridDimensions>,
): Grid<[A, B, C, D]>;
export function group_grids<A, B, C, D, E>(
    gA: Grid<A>,
    gB: Grid<B>,
    gC: Grid<C>,
    gD: Grid<D>,
    gE: Grid<E>,
    dims?: Partial<GridDimensions>,
): Grid<[A, B, C, D, E]>;
export function group_grids<A, B, C, D, E, F>(
    gA: Grid<A>,
    gB: Grid<B>,
    gC: Grid<C>,
    gD: Grid<D>,
    gE: Grid<E>,
    gF: Grid<F>,
    dims?: Partial<GridDimensions>,
): Grid<[A, B, C, D, E, F]>;
export function group_grids(...grids: any[]): Grid<any> {
    let dims: Partial<GridDimensions> = {};

    if (!(grids[grids.length - 1] instanceof Grid)) {
        dims = grids.pop();
    }

    return ngroup_grids(grids, dims);
}

export function ngroup_grids<A>(
    grids: Grid<A>[],
    dims: Partial<GridDimensions> = {},
): Grid<A[]> {
    Expect.that(grids.length > 0);
    const common_domain_tl_br: [number, number, number, number] = [
        Math.max(...grids.map((g) => g.dimensions_ref.domain_dimensions[0])),
        Math.max(...grids.map((g) => g.dimensions_ref.domain_dimensions[1])),
        Math.min(
            ...grids.map(
                (g) =>
                    g.dimensions_ref.domain_dimensions[0] +
                    g.dimensions_ref.domain_dimensions[2],
            ),
        ),
        Math.min(
            ...grids.map(
                (g) =>
                    g.dimensions_ref.domain_dimensions[1] +
                    g.dimensions_ref.domain_dimensions[3],
            ),
        ),
    ];

    let full_dims = grids[0]!.complete_partial_subgrid_dimensions(dims);
    common_domain_tl_br[0] = Math.max(
        common_domain_tl_br[0],
        full_dims.domain_dimensions[0],
    );
    common_domain_tl_br[1] = Math.max(
        common_domain_tl_br[1],
        full_dims.domain_dimensions[1],
    );
    common_domain_tl_br[2] = Math.min(
        common_domain_tl_br[2],
        full_dims.domain_dimensions[0] + full_dims.domain_dimensions[2],
    );
    common_domain_tl_br[3] = Math.min(
        common_domain_tl_br[3],
        full_dims.domain_dimensions[1] + full_dims.domain_dimensions[3],
    );

    const domain: [number, number, number, number] = [
        common_domain_tl_br[0],
        common_domain_tl_br[1],
        common_domain_tl_br[2] - common_domain_tl_br[0],
        common_domain_tl_br[3] - common_domain_tl_br[1],
    ];

    const dimensions = {
        domain_dimensions: domain,
        lattice_dimensions: full_dims.lattice_dimensions,
    };
    let resampled_grids = grids.map((g) =>
        g.lazy_with_new_dimensions(dimensions),
    );

    return new GroupedGrid(
        dimensions,
        new GroupedGridArray(resampled_grids.map((g) => g.values_ref)),
    );
}
