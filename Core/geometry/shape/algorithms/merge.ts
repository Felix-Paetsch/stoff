// IF polyline, polyline, look at endpoints
// IF polyline shape or other way, look at closest positions and insert polygon in there
// IF polygon, polygon look at closest pos and insert polygon in there

import { Vector } from "../..";
import { Polygon } from "../polygon";
import { Polyline } from "../polyline";
import { Shape } from "../shape";

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

        if (distances[2] == min) {
            return new Polyline(sh2.verticies.concat(sh1.verticies).reverse());
        }

        return new Polyline(sh1.verticies.concat([...sh2.verticies].reverse()));
    }

    if (sh2 instanceof Polyline) {
        return merge(sh2, sh1);
    }

    if (sh1 instanceof Polyline) {
        const sh2t = sh2 as Polygon;
        const closest = Shape.closest_shape_positions(sh1, sh2t)!;
        const res: Vector[] = [];

        for (let i = 0; i <= closest[0].index; i++) {
            res.push(sh1.verticies[i]!);
        }

        res.push(closest[0].vec);

        for (let i = 0; i < sh2t.verticies.length; i++) {
            res.push(
                sh2t.verticies[
                    (closest[1].index + 1 + i) % sh2t.verticies.length
                ]!,
            );
        }

        res.push(closest[1].vec);

        for (let i = closest[0].index + 1; i < sh1.verticies.length; i++) {
            res.push(sh1.verticies[i]!);
        }

        return new Polyline(res);
    }

    const sh1t = (sh2 as Polygon).to_polyline();
    const sh2t = sh2 as Polygon;
    const closest = Shape.closest_shape_positions(sh1t, sh2t)!;
    const res: Vector[] = [];

    for (let i = 0; i <= closest[0].index; i++) {
        res.push(sh1t.verticies[i]!);
    }

    res.push(closest[0].vec);

    for (let i = 0; i < sh2t.verticies.length; i++) {
        res.push(
            sh2t.verticies[(closest[1].index + 1 + i) % sh2t.verticies.length]!,
        );
    }

    res.push(closest[1].vec);

    for (let i = closest[0].index + 1; i < sh1t.verticies.length; i++) {
        res.push(sh1t.verticies[i]!);
    }

    return new Polygon(res);
}
