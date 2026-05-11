import {
    EPS,
    Expect,
    LinearTransform,
    Polyline,
    Quadrature,
    Search,
    Shape,
    Vector,
} from "@/Core";

export function polyline_with_length(
    v1: Vector,
    v2: Vector,
    length: number,
): Shape.Shape {
    const baseDist = v1.distance(v2);
    const adjusted_length = length / baseDist;

    if (Math.abs(adjusted_length - 1) < EPS.tiny) {
        return new Polyline([v1, v2]);
    }

    Expect.that(
        adjusted_length >= 1,
        "Length is too short for line with length",
    );

    const a = solveForA(adjusted_length);
    const fn = (x: number) => a * (x * x * x - 1.5 * x * x + 0.5 * x);
    const graph_fn = (x: number) => new Vector(x, fn(x));

    const transform = LinearTransform.affine_orthogonal(
        [graph_fn(0), graph_fn(1)],
        [v1, v2],
    );
    return Polyline.from_function((x) => transform(graph_fn(x)));
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
        a *= -1;
    }

    return a;
}
