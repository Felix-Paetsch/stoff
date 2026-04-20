import { BoundingBox, Color, DST, Polyline, Sketch } from "@/Core";
import { render_partial_embroidery_as_png } from "./render/entry";
import { RenderEmbroideryArgs } from "./render/render_partial_embroidery_as_png";

export type Thread = {
    color: Color.Color;
    runs: Polyline[];
};

export class Embroidery {
    constructor(public threads: Thread[] = []) {}

    run(...pl: Polyline[]) {
        if (this.threads.length == 0) {
            this.threads.push({
                color: "black",
                runs: [],
            });
        }

        this.threads[this.threads.length - 1]!.runs.push(...pl);
    }

    get runs(): Polyline[] {
        return this.threads.flatMap((t) => t.runs);
    }

    color_change(to: Color.Color = "black") {
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
                    p.map((v) =>
                        v.subtract(center).scale(Embroidery.CmToStitch),
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
                    p.map((v) => v.scale(Embroidery.stitchToCm)),
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
                    p.map((v) => v.scale(Embroidery.stitchToCm)),
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
            this.threads.flatMap((t) => t.runs).flatMap((l) => l.verticies),
        );
    }

    stitch_count() {
        let res = 0;
        for (const t of this.threads) {
            for (const r of t.runs) {
                res += r.verticies.length + 1;
            }
        }

        return res;
    }

    to_png(
        args: {
            width?: number;
            height?: number;
            padding?: number;
        } = {},
    ): Buffer {
        return this.render_partial_png(this.stitch_count(), {
            ...args,
            crossmark: false,
            start_end_markers: false,
        });
    }

    render_partial_png(
        upto: number,
        args: Partial<RenderEmbroideryArgs> = {},
    ): Buffer {
        return render_partial_embroidery_as_png(this, upto, args);
    }

    static stitchToCm = 1 / 100;
    static CmToStitch = 100;
}
