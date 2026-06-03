import { Interval } from "Core/geometry/index";
import { Vector } from "Core/geometry/vector";

export type GridInterpolator<GridType> = (
    values: {
        tl: GridType;
        tr: GridType;
        bl: GridType;
        br: GridType;
    },
    progress: [number, number],
) => GridType;

export function nearest_lattice_point_lerp<T>(): GridInterpolator<T> {
    return ({ tl, tr, bl, br }, [fx, fy]) => {
        if (fx <= 0.5) {
            return fy <= 0.5 ? tl : bl;
        }

        return fy <= 0.5 ? tr : br;
    };
}

export function lerp_interpolator<T>(
    lerp: (a: T, b: T, t: number) => T,
): GridInterpolator<T> {
    return ({ tl, tr, bl, br }, [fx, fy]) => {
        return lerp(lerp(tl, tr, fx), lerp(bl, br, fx), fy);
    };
}

export function vector_interpolator() {
    return lerp_interpolator(Vector.lerp);
}

export function number_interpolator() {
    return lerp_interpolator(Interval.lerp);
}
