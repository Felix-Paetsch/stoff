import { Polygon, Polyline, Vector } from "../..";
import { EPS } from "../../../numerics/index";

const dub_distance = EPS.tiny;

export function remove_dub<T extends Polygon | Polyline>(s: T): T {
    if (s.vertex_count < 2) {
        return s;
    }

    const vertices = s.as_polyline().vertices;
    const res: Vector[] = [vertices[0]!];

    for (let i = 1; i < vertices.length; i++) {
        if (
            vertices[vertices.length - 1]!.distance_squared(vertices[i]!) >
            dub_distance * dub_distance
        ) {
            res.push(vertices[i]!);
        }
    }

    if (s instanceof Polygon) {
        if (
            res.length > 1 &&
            res[0]!.distance_squared(res[res.length - 1]!) <
                dub_distance * dub_distance
        ) {
            res.pop();
        }
        return new Polygon(res) as T;
    }

    return new Polyline(res) as T;
}
