import { assert } from "@/Core/assert";
import { EPS } from "@/Core/StoffLib/geometry";
import { Line } from "@/Core/StoffLib/line";
import { Quadrature, Search } from "@/Core/StoffLib/numerics";
import { Point } from "@/Core/StoffLib/point";
import { Sketch } from "@/Core/StoffLib/sketch";

export default function () {
    const r = new Sketch();

    const p1 = r.point(0, 0);
    const p2 = r.point(1, 0);
    r.point(1, -0.5);
    r.point(1, 0.5);

    line_with_length(r, p1, p2, 1.5);

    return r;
}

export function line_with_length(
    sk: Sketch,
    p1: Point,
    p2: Point,
    length: number,
): Line {
    const baseDist = p1.distance(p2);
    const adjusted_length = length / baseDist;

    if (Math.abs(adjusted_length - 1) < EPS.TINY) {
        return sk.line_between_points(p1, p2);
    }
    assert(adjusted_length >= 1, "Length is too short for line with length");

    const a = solveForA(adjusted_length);
    const fn = (x: number) => a * (x * x * x - 1.5 * x * x + 0.5 * x);

    const line = sk.line_from_function_graph(p1, p2, fn);
    console.log(length, line.get_length());
    return line;
}

function cubic_derivative(x: number, a: number): number {
    return a * (3 * x * x - 3 * x + 0.5);
}

function arcLength(a: number): number {
    return Quadrature.gauss_legendre(
        (x: number) => {
            const q = cubic_derivative(x, a);
            return Math.sqrt(1 + q * q);
        },
        [0, 1],
        16,
    );
}

function arcLengthDerivative(a: number): number {
    return Quadrature.gauss_legendre((x: number) => {
        const q = cubic_derivative(x, a);
        return (q * q) / (Math.sqrt(1 + q * q) * a);
    });
}

function solveForA(targetLength: number): number {
    // Initial guess from small‑a approximation:
    // L ≈ 1 + a^2 / 40  →  a ≈ sqrt(40 (L-1))
    let a = Math.sqrt(40 * (targetLength - 1));
    a = Search.newton(arcLength, arcLengthDerivative, targetLength, a).x;
    if (a < 0) {
        a *= 1;
    }

    return a;
}
