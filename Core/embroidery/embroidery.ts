import {
    BoundingBox,
    PlaneLine,
    Polyline,
    Shape,
    Vector,
} from "@/Core/geometry";
import { Sketch } from "@/Core/sketch";
import { Color } from "Core/colors";
import { DST } from "./dst/index";

export type Thread = {
    color: Color.Color;
    runs: Polyline[];
};

export class Embroidery {
    constructor(public threads: Thread[] = []) {}

    run(...pl: Shape.Shape[]) {
        if (this.threads.length == 0) {
            this.threads.push({
                color: "black",
                runs: [],
            });
        }

        this.threads[this.threads.length - 1]!.runs.push(
            ...pl.map((p) => p.as_polyline()),
        );
    }

    get runs(): Polyline[] {
        return this.threads.flatMap((t) => t.runs);
    }

    color_change(to: Color.Color = "black") {
        if (
            this.threads.length > 0 &&
            this.threads[this.threads.length - 1]?.runs.length == 0
        ) {
            this.threads.pop();
        }

        this.threads.push({
            color: to,
            runs: [],
        });
    }

    colors() {
        return this.threads.map((t) => t.color);
    }

    to_sketch() {
        const s = new Sketch();
        for (let j = 0; j < this.threads.length; j++) {
            const t = this.threads[j]!;
            for (let i = 0; i < t.runs.length; i++) {
                const r = t.runs[i]!;
                const l = s.add_line(r);
                l.data.color = Color.toString(t.color);
                l.data.thread_index = String(j);
                l.data.run_index = String(i);
            }
        }
        return s;
    }

    to_dst(): DST {
        const center = this.bounding_box().center;

        return new DST(
            this.threads.map((t) =>
                t.runs.map((p) =>
                    p.map((v: Vector) =>
                        v
                            .subtract(center)
                            .scale(Embroidery.cm_to_stitch)
                            .mirror_at(PlaneLine.HORIZONTAL),
                    ),
                ),
            ),
        );
    }

    from_dst(dst: DST, colors: Color.Color[] = []) {
        for (let i = 0; i < dst.threads.length; i++) {
            const color = colors[i] ?? "black";
            this.threads.push({
                color,
                runs: dst.threads[i]!.map((p) =>
                    p.map((v) => v.scale(Embroidery.stitch_to_cm)),
                ),
            });
        }
    }

    static from_dst(dst: DST, colors: Color.Color[] = []) {
        const embr = new Embroidery();
        for (let i = 0; i < dst.threads.length; i++) {
            const color = colors[i] ?? "black";
            embr.threads.push({
                color,
                runs: dst.threads[i]!.map((p) =>
                    p.map((v) =>
                        v
                            .scale(Embroidery.stitch_to_cm)
                            .mirror_at(PlaneLine.HORIZONTAL),
                    ),
                ),
            });
        }

        return embr;
    }

    size(): [number, number] {
        const bb = this.bounding_box();
        return [Math.round(bb.width), Math.round(bb.height)];
    }

    bounding_box() {
        return BoundingBox.from_vectors(
            this.threads.flatMap((t) => t.runs).flatMap((l) => l.vertices),
        );
    }

    dimensions(): [number, number] {
        const bb = this.bounding_box();
        return [bb.width, bb.height];
    }

    stitch_count() {
        let res = 0;
        for (const t of this.threads) {
            for (const r of t.runs) {
                res += r.vertices.length + 1;
            }
        }

        return res;
    }

    static stitch_to_cm = 0.01 as const;
    static cm_to_stitch = 100 as const;
}
