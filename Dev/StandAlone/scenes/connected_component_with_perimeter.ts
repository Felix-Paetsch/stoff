import { CollectionMethods, Sketch } from "@/Core";
import { compute_connected_component_perimeters } from "Unstructured/compute_connected_component_perimeters";

export default function () {
    const r = new Sketch();

    const goal_points: [string, number, number][] = [
        ["A", 0, 0],
        ["B", 1, 0],
        ["C", 2, 0],
        ["D", 3, 0],
        ["E", 0, 1],
        ["F", 1, 2],
        ["G", 2, 3],
        ["H", 3, 4],
        ["I", 2, 5],
        ["J", 3, 5],
        ["K", 2, 6],
    ];

    // const lines: string[] = [
    //     "AB",
    //     "BC",
    //     "CD",
    //     "AE",
    //     "BE",
    //     "BF",
    //     "CF",
    //     "CG",
    //     "EF",
    //     "GH",
    //     "HI",
    //     "HJ",
    //     "IJ",
    //     "IK",
    //     "JK",
    // ];

    const lines: string[] = [
        "AB",
        "BC",
        "BF",
        "CD",
        "BE",
        "EF",
        "DF",
        "EK",
        "DH",
        "FG",
        "GH",
        "HI",
        "HJ",
        "JK",
    ];

    goal_points.forEach((d) => {
        const p = r.add_point(d[1], d[2]);
        p.data.name = d[0];
    });

    lines.forEach((l) => {
        const chars: [string, string] = l.split("") as any;
        const p1 = CollectionMethods.get_point(r, { name: chars[0] });
        const p2 = CollectionMethods.get_point(r, { name: chars[1] });
        if (!p1 || !p2) {
            throw new Error("Following line doesnt exist: " + l);
        }
        const ln = r.line_between_points(p1, p2);
        ln.data.name = l;
    });

    const perim = compute_connected_component_perimeters(r)[0]!;
    console.log(perim.walk.map((l) => l.data));

    return r;
}
