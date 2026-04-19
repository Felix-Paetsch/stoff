import fs from "node:fs";
import path from "node:path";
import { BoundingBox, Polyline, Vector } from "../../geometry/index";
import { parse_dst_buffer } from "./parse_dst_buffer";
import { write_dst_buffer } from "./write_dst_buffer";

export type DST_Stitches = Polyline[][];

export class DST {
    constructor(public threads: DST_Stitches = []) {}

    get runs(): Polyline[] {
        return ([] as Polyline[]).concat(...this.threads);
    }

    bounding_box() {
        return BoundingBox.from_vectors(
            ([] as Vector[]).concat(...this.runs.map((r) => r.verticies)),
        );
    }

    run(what: Polyline) {
        if (this.threads.length == 0) {
            this.threads = [[what]];
        } else {
            this.threads[this.threads.length - 1]!.push(what);
        }
    }

    color_change() {
        if (
            this.threads.length == 0 ||
            this.threads[this.threads.length - 1]!.length > 0
        ) {
            this.threads.push([]);
        }
    }

    serialize(name: string = "Untitled") {
        return write_dst_buffer(this, name);
    }

    to_file(f: string) {
        const name = path.basename(f, path.extname(f));
        fs.writeFileSync(f, this.serialize(name));
    }

    static from_file(f: string) {
        return DST.from_buffer(fs.readFileSync(f));
    }

    static from_buffer(buf: Buffer) {
        return new DST(parse_dst_buffer(buf));
    }
}
