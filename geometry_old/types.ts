import { Ray, Vector, Line } from "./classes.js";

export type Radians = number;
export type Degrees = number;
export type Length = number;

export type Polygon = Vector[];
export type LineSegment = [Vector, Vector];
export type MirrorData = Line | Ray | Vector | LineSegment | null;

export function isLineSegment(a: any): a is LineSegment {
    if (a instanceof Array && a[0] instanceof Vector && a[1] instanceof Vector)
        return true;
    return false;
}
