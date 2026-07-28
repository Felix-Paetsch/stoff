import { Polygon, Polyline } from "@/Core/geometry";
import { Json } from "@/Core/utils";
import { Vector } from "Core/geometry/vector";
import { Sketch } from "Core/sketch/sketch";
import { destringify_f64_array, stringify_f64_array } from "./number_array";

export function serialize_sketch(s: Sketch): {
    type: "sketch";
    data: Json;
} {
    const points = s.points();
    return {
        type: "sketch",
        data: {
            sketch_data: s.data,
            points: points.map((p) => ({
                data: p.data,
                vec: [p.vec.x, p.vec.y]
            })),
            lines: s.lines().map((l) => ({
                data: l.data,
                is_polygon: l.shape.is_polygon(),
                verts: stringify_f64_array(l.shape.positions),
                endpoints: [points.indexOf(l.p1)!, points.indexOf(l.p2)!],
                right_handed: l.right_handed
            }))
        }
    };
}

export function deserialize_sketch(value: {
    type: "sketch";
    data: any;
}): Sketch {
    const d = value.data;

    const s = new Sketch();
    s.data = d.sketch_data;

    const pts = d.points.map((p: { data: any; vec: [number, number] }) => {
        const pt = s.add_point(new Vector(p.vec[0], p.vec[1]));
        pt.data = p.data;
        return pt;
    });

    d.lines.forEach(
        (l: {
            data: any;
            is_polygon: boolean;
            verts: string;
            endpoints: [number, number];
            right_handed: boolean;
        }) => {
            const shape_positions = destringify_f64_array(l.verts);
            const shape = l.is_polygon
                ? new Polygon(shape_positions)
                : new Polyline(shape_positions);

            const line = s.add_line(
                shape,
                pts[l.endpoints[0]],
                pts[l.endpoints[1]]
            );

            line.set_handedness(l.right_handed);
            line.data = l.data;
        }
    );

    return s;
}
