import { Radians, Vector } from "@/Core/geometry";
import { PolylineFunction } from "../index.ts";

export { Spline } from "./splines.ts";
export function arc(
    center: Vector,
    radius: number,
    fill_amt: Radians,
    offset: Radians = 0,
): PolylineFunction {
    const r = Math.abs(radius);

    return (t: number) => {
        return new Vector(
            r * Math.sin(2 * Math.PI * fill_amt * t + offset),
            r * Math.cos(2 * Math.PI * fill_amt * t + offset),
        ).add(center);
    };
}

export function circle(
    center: Vector,
    radius: number,
    offset: Radians = 0,
): PolylineFunction {
    const r = Math.abs(radius);

    return (t: number) => {
        return new Vector(
            r * Math.sin(2 * Math.PI * t + offset),
            r * Math.cos(2 * Math.PI * t + offset),
        ).add(center);
    };
}
