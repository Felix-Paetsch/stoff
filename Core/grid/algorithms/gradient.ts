import { Matrix } from "Core/geometry/matrix";
import { Vector } from "Core/geometry/vector";
import { map_windows } from "../grids/index";
import { MatrixGrid, NumberGrid, VectorGrid } from "../types";

export function gradient(g: NumberGrid): VectorGrid {
    return map_windows(
        "vector",
        g,
        [3, 3],
        (w) =>
            new Vector(
                (w([2, 1]) - w([0, 1])) / 2,
                (w([1, 2]) - w([1, 0])) / 2,
            ),
    );
}

export function gradient_scharr(g: NumberGrid): VectorGrid {
    return map_windows("vector", g, [3, 3], (w) => {
        const dx =
            (3 * w([2, 0]) +
                10 * w([2, 1]) +
                3 * w([2, 2]) -
                3 * w([0, 0]) -
                10 * w([0, 1]) -
                3 * w([0, 2])) /
            32;

        const dy =
            (3 * w([0, 2]) +
                10 * w([1, 2]) +
                3 * w([2, 2]) -
                3 * w([0, 0]) -
                10 * w([1, 0]) -
                3 * w([2, 0])) /
            32;

        return new Vector(dx, dy);
    });
}

export function slope_tensor(g: NumberGrid): MatrixGrid {
    return map_windows("matrix", g, [3, 3], (w) => {
        const dx =
            (3 * w([2, 0]) +
                10 * w([2, 1]) +
                3 * w([2, 2]) -
                3 * w([0, 0]) -
                10 * w([0, 1]) -
                3 * w([0, 2])) /
            32;

        const dy =
            (3 * w([0, 2]) +
                10 * w([1, 2]) +
                3 * w([2, 2]) -
                3 * w([0, 0]) -
                10 * w([1, 0]) -
                3 * w([2, 0])) /
            32;

        return Matrix.from_entries(dx * dx, dx * dy, dx * dy, dy * dy);
    });
}

export function hessian(g: NumberGrid): MatrixGrid {
    return map_windows("matrix", g, [3, 3], (w) => {
        const center = w([1, 1]);

        const dxx = w([0, 1]) - 2 * center + w([2, 1]);

        const dyy = w([1, 0]) - 2 * center + w([1, 2]);

        const dxy = (w([2, 2]) - w([0, 2]) - w([2, 0]) + w([0, 0])) / 4;

        return Matrix.from_entries(dxx, dxy, dxy, dyy);
    });
}
