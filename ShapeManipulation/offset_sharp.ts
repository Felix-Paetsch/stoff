import { Polygon, Polyline, Shape } from "@/Core";

export function offset_sharp(sh: Shape): Shape;
export function offset_sharp(sh: Polyline): Polyline;
export function offset_sharp(sh: Polygon): Polygon;
export function offset_sharp(_sh: Shape): Shape {
    throw new Error();
}
