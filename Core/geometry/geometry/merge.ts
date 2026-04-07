// IF polyline, polyline, look at endpoints
// IF polyline shape or other way, look at closest positions and insert polygon in there
// IF polygon, polygon look at closest pos and insert polygon in there

import { Polygon } from "../shape/polygon";
import { Polyline } from "../shape/polyline";
import { Shape } from "../shape/shape";

export function merge(sh1: Polygon, sh2: Polygon): Polygon;
export function merge(sh1: Polyline, sh2: Polygon): Polyline;
export function merge(sh1: Polygon, sh2: Polyline): Polyline;
export function merge(sh1: Polyline, sh2: Polyline): Polyline;
export function merge(sh1: Shape, sh2: Shape): Shape;
export function merge(sh1: Shape, sh2: Shape): Shape {
    if (sh1.is_empty()) {
        return sh2;
    } else if (sh2.is_empty()) {
        return sh1;
    }

    if (sh1 instanceof Polyline && sh2 instanceof Polyline) {
        const distances = [
            sh1.last()!.distance(sh2.first()!),
            sh1.first()!.distance(sh2.first()!),
            sh1.first()!.distance(sh2.last()!),
            sh1.last()!.distance(sh2.last()!),
        ] as const;
        const min = Math.min(...distances);

        if (distances[0] == min) {
            return new Polyline(sh1.verticies.concat(sh2.verticies));
        }

        if (distances[1] == min) {
            return new Polyline(
                [...sh1.verticies].reverse().concat(sh2.verticies),
            );
        }

        throw new Error("Todo!!");
    }
    throw new Error();
}
