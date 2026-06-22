import { CONF } from "@/Core/config";

import { Polygon, Polyline, Vector } from "../..";

const dub_distance = CONF.core_approximately_zero;
const dub_distance_squared = dub_distance * dub_distance;

export function remove_dub<T extends Polygon | Polyline>(s: T): T {
    const vertices = s.as_polyline().vertices;

    if (vertices.length < 2) {
        return s;
    }

    const res: Vector[] = [vertices[0]!];

    for (let i = 1; i < vertices.length; i++) {
        const v = vertices[i]!;
        const last = res[res.length - 1]!;

        if (last.distance_squared(v) > dub_distance_squared) {
            res.push(v);
        }
    }

    if (s instanceof Polygon) {
        if (
            res.length > 1 &&
            res[0]!.distance_squared(res[res.length - 1]!) <=
                dub_distance_squared
        ) {
            res.pop();
        }

        return new Polygon(res) as T;
    }

    return new Polyline(res) as T;
}
