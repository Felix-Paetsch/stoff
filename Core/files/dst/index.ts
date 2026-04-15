import { BoundingBox, Polyline, Vector } from "Core/geometry/index";
import { parse_dst_file } from "./parse_dst_file";

export type DST_Stitches = Polyline[][];

export class DST {
    constructor(public threads: DST_Stitches) {}

    get runs(): Polyline[] {
        return ([] as Polyline[]).concat(...this.threads);
    }

    bounding_box() {
        return BoundingBox.from_points(
            ([] as Vector[]).concat(...this.runs.map((r) => r.verticies)),
        );
    }

    static from_file(f: string) {
        return new DST(parse_dst_file(f));
    }
}
