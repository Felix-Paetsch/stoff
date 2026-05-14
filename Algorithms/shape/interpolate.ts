import { Fraction, Shape, Vector } from "@/Core";

export type NumberFunction = (t: Fraction) => Fraction;

export function interpolate_shapes(
    line1: Shape.Shape,
    line2: Shape.Shape,
    f: NumberFunction = (x) => x,
    p1: NumberFunction = (x) => x,
    p2: NumberFunction = (x) => x,
): Shape.ShapeFunction {
    return (t: number) => {
        return Vector.lerp(line1.sample(p1(t)), line2.sample(p2(t)), f(t));
    };
}
