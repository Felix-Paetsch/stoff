import { Interval, Vector } from "@/Core/geometry";
import { AnyReturnTypeFunction } from "Core/types/index";
import { Grid, GridDimensions } from "./grid";
import { AssociatedGrid, GridValue } from "./types";

export function pair_map<
    S extends GridValue,
    T extends GridValue,
    F extends AnyReturnTypeFunction<[S, T, Vector], GridValue>,
>(
    g: Grid<S>,
    h: Grid<T>,
    map: F,
    dim: Partial<GridDimensions> = {},
): AssociatedGrid<ReturnType<F>> {
    let dom_dim_g = g.dimensions_ref.domain_dimensions;
    let dom_dim_h = h.dimensions_ref.domain_dimensions;

    let x_overlap = Interval.overlap(
        [dom_dim_g[0], dom_dim_g[0] + dom_dim_g[2]],
        [dom_dim_h[0], dom_dim_h[0] + dom_dim_h[2]],
    );
    let y_overlap = Interval.overlap(
        [dom_dim_g[1], dom_dim_g[1] + dom_dim_g[3]],
        [dom_dim_h[1], dom_dim_h[1] + dom_dim_h[3]],
    );

    if (!dim.domain_dimensions) {
        dim.domain_dimensions = [
            x_overlap[0],
            y_overlap[0],
            x_overlap[1] - x_overlap[0],
            y_overlap[1] - y_overlap[0],
        ];
    } else {
        const [x, y, w, h] = dim.domain_dimensions;
        const start_x = Math.max(x_overlap[0], x);
        const start_y = Math.max(y_overlap[0], y);

        const end_x = Math.min(x_overlap[1], x + w);
        const end_y = Math.min(y_overlap[1], y + h);

        dim.domain_dimensions = [
            start_x,
            start_y,
            end_x - start_x,
            end_y - start_y,
        ];
    }

    if (!dim.lattice_dimensions) {
        dim.lattice_dimensions = [
            Math.ceil(
                (g.dimensions_ref.lattice_dimensions[0] *
                    dim.domain_dimensions![2]) /
                    g.dimensions_ref.domain_dimensions[2],
            ),
            Math.ceil(
                (g.dimensions_ref.lattice_dimensions[1] *
                    dim.domain_dimensions![3]) /
                    g.dimensions_ref.domain_dimensions[3],
            ),
        ];
    }

    const dim_g_agree = Grid.dimensions_agree(
        g.dimensions_ref,
        dim as GridDimensions,
    );
    const dim_h_agree = Grid.dimensions_agree(
        h.dimensions_ref,
        dim as GridDimensions,
    );

    if (dim_g_agree && dim_h_agree) {
        let values: ReturnType<F>[] = [];
        let w = dim.lattice_dimensions[0];

        for (let i = 0; i < dim.lattice_dimensions[0]; i++) {
            for (let j = 0; j < dim.lattice_dimensions[1]; j++) {
                values.push(
                    map(
                        g.values_ref[i * w + j]!,
                        h.values_ref[i * w + j]!,
                        g.vector_at_lattice_point([i, j]),
                    ) as ReturnType<F>,
                );
            }
        }

        return Grid.from(dim as GridDimensions, values) as any;
    }

    if (dim_g_agree) {
        let values: ReturnType<F>[] = [];
        let w = dim.lattice_dimensions[0];

        for (let i = 0; i < dim.lattice_dimensions[0]; i++) {
            for (let j = 0; j < dim.lattice_dimensions[1]; j++) {
                let v = g.vector_at_lattice_point([i, j]);
                values.push(
                    map(
                        g.values_ref[i * w + j]!,
                        h.sample_at(v)!,
                        v,
                    ) as ReturnType<F>,
                );
            }
        }

        return Grid.from(dim as GridDimensions, values) as any;
    }

    if (dim_h_agree) {
        let values: ReturnType<F>[] = [];
        let w = dim.lattice_dimensions[0];

        for (let i = 0; i < dim.lattice_dimensions[0]; i++) {
            for (let j = 0; j < dim.lattice_dimensions[1]; j++) {
                let v = h.vector_at_lattice_point([i, j]);
                values.push(
                    map(
                        g.sample_at(v)!,
                        h.values_ref[i * w + j]!,
                        v,
                    ) as ReturnType<F>,
                );
            }
        }

        return Grid.from(dim as GridDimensions, values) as any;
    }

    let values: ReturnType<F>[] = [];

    for (let i = 0; i < dim.lattice_dimensions[0]; i++) {
        for (let j = 0; j < dim.lattice_dimensions[1]; j++) {
            let v = h.vector_at_lattice_point([i, j]);
            values.push(
                map(g.sample_at(v)!, h.sample_at(v)!, v) as ReturnType<F>,
            );
        }
    }

    return Grid.from(dim as GridDimensions, values) as any;
}
