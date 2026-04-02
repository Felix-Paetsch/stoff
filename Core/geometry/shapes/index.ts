import { Fraction } from "../1d";
import { Vector } from "../classes";
import { EPS } from "../eps";
import { Polygon } from "./polygon";
import { Polyline } from "./polyline";

export type Shape = Polyline | Polygon;

export function is_polyline(l: Shape) {
    return l instanceof Polyline;
}

export function is_polygon(l: Shape) {
    return l instanceof Polygon;
}

export type PolylineVectors = Vector[];
export type PolygonVectors = Vector[];
export type ShapeVectors = Vector[];

export type PolylineFunction = (t: Fraction) => Vector;
export type PolygonFunction = (t: Fraction) => Vector;
export type ShapeFunction = (t: Fraction) => Vector;

export function is_polygon_function(f: ShapeFunction): boolean {
    return f(0).equals(f(1));
}

export function is_polyline_function(f: ShapeFunction): boolean {
    return !f(0).equals(f(1), EPS.VISUAL);
}

export function is_polyline_vectors(v: ShapeVectors): boolean {
    return v[0]!.equals(v[v.length - 1]!);
}

export function is_polygon_vectors(v: ShapeVectors): boolean {
    return !v[0]!.equals(v[v.length - 1]!, EPS.VISUAL);
}

export function to_shape(v: ShapeVectors | ShapeFunction): Shape {
    if (Array.isArray(v)) {
        if (is_polyline_vectors(v)) {
            return new Polyline(v);
        }

        return new Polygon(v.slice(0, -1));
    }

    if (is_polygon_function(v)) {
        return Polygon.from_polygon_function(v);
    }

    return Polyline.from_polyline_function(v);
}
