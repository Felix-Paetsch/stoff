import { IGrid } from "../igrid";

export function resample<S, N extends string>(
    g: IGrid<S, N>,
    samples: [number, number],
): IGrid<S, N> {
    return g.with_new_dimensions({
        domain_dimensions: g.dimensions().domain_dimensions,
        lattice_dimensions: samples,
    });
}
