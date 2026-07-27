import { Expect } from "Core/expect";
import { EPS } from "Core/numerics/eps";
import { GridWindow } from "ProcedualArt/primitives/grid/base/index";
import { CompassRotationAmount, CompassRotationAmounts } from "./types";

export type ConvolutionMatrix = number[][];

export class ConvolutionKernel {
    public rows: number;
    public columns: number;
    constructor(protected matrix: ConvolutionMatrix) {
        this.rows = matrix.length;
        this.columns = matrix[0]!.length;
        Expect.that(
            () =>
                matrix.every((r) => r.length == this.columns) &&
                this.columns > 0
        );
    }

    static zeros(rows: number, cols: number) {
        return new ConvolutionKernel(
            Array.from({ length: rows }, () => Array(cols).fill(0))
        );
    }

    add(other: ConvolutionKernel): ConvolutionKernel {
        Expect.that(this.rows === other.rows && this.columns == other.columns);
        let res = ConvolutionKernel.zeros(this.rows, this.columns);
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                res.matrix[r]![c] = this.matrix[r]![c]! + other.matrix[r]![c]!;
            }
        }
        return res;
    }

    scale(w: number): ConvolutionKernel {
        let res = this.copy();
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                res.matrix[r]![c]! *= w;
            }
        }
        return res;
    }

    is_seperable(): boolean {
        return this.seperable_parts() !== undefined;
    }

    seperable_parts(): undefined | [number[], number[]] {
        const m = this.matrix;

        let pivotRow = -1;
        let pivotCol = -1;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                if (Math.abs(m[r]![c]!) > EPS.tiny) {
                    pivotRow = r;
                    pivotCol = c;
                    break;
                }
            }
            if (pivotRow !== -1) break;
        }

        if (pivotRow === -1) {
            return [Array(this.columns).fill(0), Array(this.rows).fill(0)];
        }

        const pivot = m[pivotRow]![pivotCol]!;

        const col = Array(this.rows).fill(0);
        const row = Array(this.columns).fill(0);

        for (let r = 0; r < this.rows; r++) {
            col[r] = m[r]![pivotCol]!;
        }
        for (let c = 0; c < this.columns; c++) {
            row[c] = m[pivotRow]![c]! / pivot;
        }

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                if (Math.abs(col[r]! * row[c]! - m[r]![c]!) > EPS.tiny) {
                    return undefined;
                }
            }
        }

        return [row, col];
    }

    static new_seperable(row: number[], col: number[]) {
        let res = ConvolutionKernel.zeros(col.length, row.length);
        for (let r = 0; r < col.length; r++) {
            for (let c = 0; c < row.length; c++) {
                res.matrix[r]![c] = col[r]! * row[c]!;
            }
        }
        return res;
    }

    rotate(by: CompassRotationAmount): ConvolutionKernel {
        if (by == "0") return this.copy();

        if (this.rows == this.columns && this.rows == 3) {
            return new ConvolutionKernel(rotate_3x3_kernel(this.matrix, by));
        } else if (this.rows == this.columns && this.rows == 5) {
            return new ConvolutionKernel(rotate_5x5_kernel(this.matrix, by));
        }

        if (by == "180") {
            const copy = this.copy();
            copy.matrix.reverse();
            copy.matrix.forEach((a) => a.reverse());
            return copy;
        }

        if (this.rows == this.columns && this.rows == 1) {
            return new ConvolutionKernel([[this.matrix[0]![0]!]]);
        }

        if (by == "90") {
            const new_kernel = ConvolutionKernel.zeros(this.columns, this.rows);
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.columns; j++) {
                    new_kernel.matrix[j]![i] =
                        this.matrix[this.rows - i - 1]![j]!;
                }
            }
            return new_kernel;
        }

        if (by == "270") {
            const new_kernel = ConvolutionKernel.zeros(this.columns, this.rows);
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.columns; j++) {
                    new_kernel.matrix[j]![i] =
                        this.matrix[i]![this.columns - j - 1]!;
                }
            }
            return new_kernel;
        }

        throw new Error(
            "Can rotate things other than 1x1, 3x3, 5x5 only by mult of 90 deg."
        );
    }

    copy(): ConvolutionKernel {
        return new ConvolutionKernel([...this.matrix.map((r) => [...r])]);
    }

    mirror(axis: "x" | "y" | "point"): ConvolutionKernel {
        const copy = this.copy();
        const m = copy.matrix;
        if (axis == "x" || axis == "point") {
            m.reverse();
        }
        if (axis == "y" || axis == "point") {
            m.forEach((a) => a.reverse());
        }
        return copy;
    }
    normalize(): ConvolutionKernel {
        const b = this.bias();
        Expect.that(b != 0, "Cant normalize with zero bias!");
        return this.scale(1 / b);
    }

    pointwise_mult(other: ConvolutionKernel): ConvolutionKernel {
        Expect.that(this.rows === other.rows && this.columns == other.columns);
        let res = ConvolutionKernel.zeros(this.rows, this.columns);
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                res.matrix[r]![c] = this.matrix[r]![c]! * other.matrix[r]![c]!;
            }
        }
        return res;
    }

    bias(): number {
        let res = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                res += this.matrix[r]![c]!;
            }
        }
        return res;
    }
    into_matrix(): number[][] {
        return this.matrix;
    }
    matrix_ref(): readonly (readonly number[])[] {
        return this.matrix;
    }

    convolve_window(w: GridWindow<number>) {
        let res = 0;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.columns; c++) {
                res += this.matrix[r]![c]! * w([r, c]);
            }
        }
        return res;
    }
}

function rotate_3x3_kernel(
    k: number[][],
    by: CompassRotationAmount
): number[][] {
    // [row, col]
    const matrix = Array.from({ length: 3 }, () => Array(3).fill(0));
    const matrix3x3orbit = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 2],
        [2, 0],
        [2, 1],
        [2, 2]
    ] as const;

    matrix[1]![1] = k[1]![1]!;

    for (let i = 0; i < 8; i++) {
        let src_idx = matrix3x3orbit[i]!;
        let new_idx =
            matrix3x3orbit[
                (i + CompassRotationAmounts.findIndex((a) => by == a)!) % 8
            ]!;
        matrix[new_idx[0]]![new_idx[1]] = k[src_idx[0]]![src_idx[1]]!;
    }

    return matrix;
}

function rotate_5x5_kernel(
    k: number[][],
    by: CompassRotationAmount
): number[][] {
    // [row, col]
    const matrix = Array.from({ length: 5 }, () => Array(5).fill(0));

    matrix[2]![2] = k[2]![2]!;

    const matrix3x3orbit = [
        [0, 0],
        [0, 1],
        [0, 2],
        [1, 0],
        [1, 2],
        [2, 0],
        [2, 1],
        [2, 2]
    ] as const;
    const matrix5x5corner_orbit = matrix3x3orbit.map(
        ([a, b]) => [a + 1, b + 1] as const
    );
    const matrix5x5center_orbit = matrix3x3orbit.map(
        ([a, b]) => [a * 2, b * 2] as const
    );
    const matrix5x5edge_orbit = [
        [0, 1],
        [0, 3],
        [1, 4],
        [3, 4],
        [4, 3],
        [4, 1],
        [3, 0],
        [1, 0]
    ] as const;

    for (let orbit of [
        matrix5x5corner_orbit,
        matrix5x5center_orbit,
        matrix5x5edge_orbit
    ]) {
        for (let i = 0; i < 8; i++) {
            let src_idx = orbit[i]!;
            let new_idx =
                orbit[
                    (i + CompassRotationAmounts.findIndex((a) => a == by)!) % 8
                ]!;
            matrix[new_idx[0]]![new_idx[1]] = k[src_idx[0]]![src_idx[1]]!;
        }
    }

    return matrix;
}
