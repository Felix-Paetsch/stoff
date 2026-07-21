import { Matrix } from "Core/geometry/matrix";
import { Vector } from "Core/geometry/vector";
import { grid_cell_dimensions, map_windows } from "../grids/index";
import { MatrixGrid, NumberGrid, VectorGrid } from "../types";

export function gradient(g: NumberGrid): VectorGrid {
    const a = grid_cell_dimensions(g);

    return map_windows(
        "vector",
        g,
        [3, 3],
        (w) =>
            new Vector(
                (w([2, 1]) - w([0, 1])) / (2 * a[0]),
                (w([1, 2]) - w([1, 0])) / (2 * a[1]),
            ),
    );
}

export function gradient_scharr(g: NumberGrid): VectorGrid {
    const a = grid_cell_dimensions(g);

    return map_windows("vector", g, [3, 3], (w) => {
        const dx =
            (3 * w([2, 0]) +
                10 * w([2, 1]) +
                3 * w([2, 2]) -
                3 * w([0, 0]) -
                10 * w([0, 1]) -
                3 * w([0, 2])) /
            (32 * a[0]);

        const dy =
            (3 * w([0, 2]) +
                10 * w([1, 2]) +
                3 * w([2, 2]) -
                3 * w([0, 0]) -
                10 * w([1, 0]) -
                3 * w([2, 0])) /
            (32 * a[1]);

        return new Vector(dx, dy);
    });
}

export function slope_tensor(g: NumberGrid): MatrixGrid {
    const a = grid_cell_dimensions(g);

    return map_windows("matrix", g, [3, 3], (w) => {
        const dx =
            (3 * w([2, 0]) +
                10 * w([2, 1]) +
                3 * w([2, 2]) -
                3 * w([0, 0]) -
                10 * w([0, 1]) -
                3 * w([0, 2])) /
            (32 * a[0]);

        const dy =
            (3 * w([0, 2]) +
                10 * w([1, 2]) +
                3 * w([2, 2]) -
                3 * w([0, 0]) -
                10 * w([1, 0]) -
                3 * w([2, 0])) /
            (32 * a[1]);

        return Matrix.from_entries(dx * dx, dx * dy, dx * dy, dy * dy);
    });
}

export function hessian(g: NumberGrid): MatrixGrid {
    const a = grid_cell_dimensions(g);
    const [dx, dy] = a;

    return map_windows("matrix", g, [3, 3], (w) => {
        const center = w([1, 1]);

        const dxx = (w([0, 1]) - 2 * center + w([2, 1])) / (dx * dx);

        const dyy = (w([1, 0]) - 2 * center + w([1, 2])) / (dy * dy);

        const dxy =
            (w([2, 2]) - w([0, 2]) - w([2, 0]) + w([0, 0])) / (4 * dx * dy);

        return Matrix.from_entries(dxx, dxy, dxy, dyy);
    });
}
