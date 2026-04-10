import { Vector } from "./vector";

export type Radians = number;
export type Degrees = number;

export { type Fraction, type Interval } from "./interval";

export function deg_to_rad(d: Degrees): Radians {
    return (Math.PI * d) / 180;
}

export function rad_to_deg(r: Radians): Degrees {
    return (180 / Math.PI) * r;
}

export type LineSegment = [Vector, Vector];
