import { Matrix, Vector } from "@/Core/geometry";
import { Interval } from "@/Core/numerics";
import { GridDimensions, GridTypeName, Vec3 } from "../../types";
import { Grid } from "./grid";
import { GridConstructor } from "./types";

export function create_grid_constructor(
    create_for: GridTypeName | GridConstructor<any, any>
): GridConstructor<any, any> {
    if (typeof create_for == "function") return create_for;

    const lerp_map: [GridTypeName, (a: any, b: any, t: number) => any][] = [
        ["number", Interval.lerp],
        ["vector", Vector.lerp],
        ["boolean", (a: boolean, b: boolean, t: number) => (t <= 0.5 ? a : b)],
        [
            "vec3",
            (a: Vec3, b: Vec3, t: number) => [
                Interval.lerp(a[0], b[0], t),
                Interval.lerp(a[1], b[1], t),
                Interval.lerp(a[2], b[2], t)
            ]
        ],
        [
            "matrix",
            (a: Matrix, b: Matrix, t: number) => {
                return a.scale(1 - t).add(b.scale(t));
            }
        ]
    ];

    const lerp = lerp_map.find((a) => a[0] == create_for)![1];
    return (d: GridDimensions, v: any[]) => new Grid(d, v, lerp, create_for);
}
