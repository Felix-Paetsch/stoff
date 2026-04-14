import { EPS } from "Core/numerics/index";
import { Polygon, Polyline, Vector } from "../..";

const dub_distance = EPS.tiny;

export function remove_dub<T extends Polygon | Polyline>(s: T): T {
    if (s.vertex_count < 2) {
        return s;
    }

    const verticies = s.as_polyline().verticies;
    const res: Vector[] = [verticies[0]!];

    for (let i = 1; i < verticies.length; i++) {
        if (
            verticies[verticies.length - 1]!.distance_squared(verticies[i]!) >
            dub_distance * dub_distance
        ) {
            res.push(verticies[i]!);
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
