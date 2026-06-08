import { Interval } from "Core/geometry";
import { EPS } from "./eps";
import { PartitionFunction } from "./partition_unity/index";

export type SamplePoint = [number, number];
export type BoundaryCondition = "natural" | [number, number] | "quadratic";

export function linear(sample_points: SamplePoint[]): (a: number) => number {
    sample_points.sort((a, b) => a[0] - b[0]);

    if (sample_points.length === 0) {
        return () => NaN;
    }
    if (sample_points.length === 1) {
        const y = sample_points[0]![1];
        return () => y;
    }

    for (let i = 1; i < sample_points.length; i++) {
        if (
            Math.abs(sample_points[i]![0] - sample_points[i - 1]![0]) < EPS.tiny
        ) {
            throw new Error("Interpolation requires unique x values.");
        }
    }

    const xs = sample_points.map((p) => p[0]);
    const ys = sample_points.map((p) => p[1]);

    return (a: number): number => {
        const i = findSegment(xs, a);
        const x0 = xs[i]!;
        const x1 = xs[i + 1]!;
        const y0 = ys[i]!;
        const y1 = ys[i + 1]!;

        if (Math.abs(x1 - x0) < EPS.tiny) {
            return (y0 + y1) / 2;
        }

        return Interval.lerp(y0, y1, Interval.inverse_lerp(x0, x1, a));
    };
}

export function cubic(
    sample_points: SamplePoint[],
    bc: BoundaryCondition,
): (a: number) => number {
    sortPoints(sample_points);

    const n = sample_points.length;

    if (n === 0) {
        return () => NaN;
    }
    if (n === 1) {
        const y = sample_points[0]![1];
        return () => y;
    }
    if (n === 2) {
        return linear(sample_points);
    }

    const xs = sample_points.map((p) => p[0]);
    const ys = sample_points.map((p) => p[1]);

    const h = new Array<number>(n - 1);
    for (let i = 0; i < n - 1; i++) {
        h[i] = xs[i + 1]! - xs[i]!;
    }

    const lower = new Array<number>(n).fill(0);
    const diag = new Array<number>(n).fill(0);
    const upper = new Array<number>(n).fill(0);
    const rhs = new Array<number>(n).fill(0);

    for (let i = 1; i < n - 1; i++) {
        lower[i] = h[i - 1]!;
        diag[i] = 2 * (h[i - 1]! + h[i]!);
        upper[i] = h[i]!;
        rhs[i] =
            6 *
            ((ys[i + 1]! - ys[i]!) / h[i]! - (ys[i]! - ys[i - 1]!) / h[i - 1]!);
    }

    if (bc === "natural") {
        diag[0] = 1;
        diag[n - 1] = 1;
    } else if (bc === "quadratic") {
        diag[0] = 1;
        upper[0] = -1;
        diag[n - 1] = 1;
        lower[n - 1] = -1;
    } else {
        const [m0, mn] = bc;

        diag[0] = 2 * h[0]!;
        upper[0] = h[0]!;
        rhs[0] = 6 * ((ys[1]! - ys[0]!) / h[0]! - m0);

        lower[n - 1] = h[n - 2]!;
        diag[n - 1] = 2 * h[n - 2]!;
        rhs[n - 1] = 6 * (mn - (ys[n - 1]! - ys[n - 2]!) / h[n - 2]!);
    }

    const secondDeriv = solveTridiagonal(lower, diag, upper, rhs);

    return (a: number): number => {
        const i = findSegment(xs, a);
        const x0 = xs[i]!;
        const x1 = xs[i + 1]!;
        const y0 = ys[i]!;
        const y1 = ys[i + 1]!;
        const M0 = secondDeriv[i]!;
        const M1 = secondDeriv[i + 1]!;
        const hi = x1 - x0;

        if (Math.abs(hi) < EPS.tiny) {
            return (y0 + y1) / 2;
        }

        const left = x1 - a;
        const right = a - x0;

        return (
            (M0 * left * left * left) / (6 * hi) +
            (M1 * right * right * right) / (6 * hi) +
            (y0 - (M0 * hi * hi) / 6) * (left / hi) +
            (y1 - (M1 * hi * hi) / 6) * (right / hi)
        );
    };
}

export function akima(
    sample_points: SamplePoint[],
    bc: BoundaryCondition,
): (a: number) => number {
    sortPoints(sample_points);

    const n = sample_points.length;

    if (n === 0) {
        return () => NaN;
    }
    if (n === 1) {
        const y = sample_points[0]![1];
        return () => y;
    }
    if (n === 2) {
        return linear(sample_points);
    }
    if (n < 5) {
        return cubic(sample_points, bc);
    }

    const xs = sample_points.map((p) => p[0]);
    const ys = sample_points.map((p) => p[1]);

    const slopes = new Array<number>(n - 1);
    for (let i = 0; i < n - 1; i++) {
        slopes[i] = (ys[i + 1]! - ys[i]!) / (xs[i + 1]! - xs[i]!);
    }

    const ext = new Array<number>(n + 3);
    for (let i = 0; i < n - 1; i++) {
        ext[i + 2] = slopes[i]!;
    }

    ext[1] = 2 * ext[2]! - ext[3]!;
    ext[0] = 2 * ext[1]! - ext[2]!;
    ext[n + 1] = 2 * ext[n]! - ext[n - 1]!;
    ext[n + 2] = 2 * ext[n + 1]! - ext[n]!;

    const deriv = new Array<number>(n);

    for (let i = 0; i < n; i++) {
        const w1 = Math.abs(ext[i + 3]! - ext[i + 2]!);
        const w2 = Math.abs(ext[i + 1]! - ext[i]!);

        if (w1 + w2 < EPS.tiny) {
            deriv[i] = (ext[i + 1]! + ext[i + 2]!) / 2;
        } else {
            deriv[i] = (w1 * ext[i + 1]! + w2 * ext[i + 2]!) / (w1 + w2);
        }
    }

    if (bc === "natural") {
        deriv[0] = slopes[0]!;
        deriv[n - 1] = slopes[n - 2]!;
    } else if (bc === "quadratic") {
        deriv[0] = 2 * slopes[0]! - deriv[1]!;
        deriv[n - 1] = 2 * slopes[n - 2]! - deriv[n - 2]!;
    } else {
        deriv[0] = bc[0];
        deriv[n - 1] = bc[1];
    }

    return (a: number): number => {
        const i = findSegment(xs, a);
        const x0 = xs[i]!;
        const x1 = xs[i + 1]!;
        const y0 = ys[i]!;
        const y1 = ys[i + 1]!;
        const d0 = deriv[i]!;
        const d1 = deriv[i + 1]!;
        const h = x1 - x0;

        if (Math.abs(h) < EPS.tiny) {
            return (y0 + y1) / 2;
        }

        const s = (a - x0) / h;
        const s2 = s * s;
        const s3 = s2 * s;

        return (
            (2 * s3 - 3 * s2 + 1) * y0 +
            (s3 - 2 * s2 + s) * h * d0 +
            (-2 * s3 + 3 * s2) * y1 +
            (s3 - s2) * h * d1
        );
    };
}

export function from_partition_of_unity(
    n: number[],
    a: PartitionFunction,
): (a: number) => number {
    return (x: number) => {
        const part = a(x);
        let res = 0;
        for (let i = 0; i < part.length; i++) {
            res += n[i]! * part[i]!;
        }
        return res;
    };
}

function sortPoints(sample_points: SamplePoint[]): void {
    sample_points.sort((a, b) => a[0] - b[0]);

    for (let i = 1; i < sample_points.length; i++) {
        if (
            Math.abs(sample_points[i]![0] - sample_points[i - 1]![0]) < EPS.tiny
        ) {
            throw new Error("Interpolation requires unique x values.");
        }
    }
}

function findSegment(xs: number[], x: number): number {
    if (xs.length < 2) {
        return 0;
    }
    if (x <= xs[0]!) {
        return 0;
    }
    if (x >= xs[xs.length - 1]!) {
        return xs.length - 2;
    }

    let lo = 0;
    let hi = xs.length - 1;

    while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (x < xs[mid]!) {
            hi = mid;
        } else {
            lo = mid;
        }
    }

    return lo;
}

function solveTridiagonal(
    lower: number[],
    diag: number[],
    upper: number[],
    rhs: number[],
): number[] {
    const n = rhs.length;
    const cp = new Array<number>(n).fill(0);
    const dp = new Array<number>(n).fill(0);
    const out = new Array<number>(n).fill(0);

    if (Math.abs(diag[0]!) < EPS.tiny) {
        throw new Error("Singular tridiagonal system.");
    }

    cp[0] = upper[0]! / diag[0]!;
    dp[0] = rhs[0]! / diag[0]!;

    for (let i = 1; i < n; i++) {
        const denom = diag[i]! - lower[i]! * cp[i - 1]!;
        if (Math.abs(denom) < EPS.tiny) {
            throw new Error("Singular tridiagonal system.");
        }
        cp[i] = i < n - 1 ? upper[i]! / denom : 0;
        dp[i] = (rhs[i]! - lower[i]! * dp[i - 1]!) / denom;
    }

    out[n - 1] = dp[n - 1]!;
    for (let i = n - 2; i >= 0; i--) {
        out[i] = dp[i]! - cp[i]! * out[i + 1]!;
    }

    return out;
}
