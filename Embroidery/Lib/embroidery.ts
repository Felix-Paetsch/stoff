import { BoundingBox, Color, DST, Polyline, Sketch } from "@/Core";
import {
    render_embroidery_as_png,
    RenderEmbroideryArgs,
} from "./render_embroidery_as_png";

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
        return new DST(this.threads.map((t) => t.runs));
    }

    to_png(args: Partial<RenderEmbroideryArgs> = {}): Buffer {
        return render_embroidery_as_png(this, args);
    }

    from_dst(dst: DST, colors: Color.Color[] = []) {
        for (let i = 0; i < dst.threads.length; i++) {
            const color = colors[i] ?? "black";
            this.threads.push({
                color,
                runs: dst.threads[i]!,
            });
        }
    }

    size_cm() {
        const bb = this.bounding_box();
        return [Math.round(bb.width) / 10000, Math.round(bb.height) / 10000];
    }

    bounding_box() {
        return BoundingBox.from_vectors(
            this.threads.flatMap((t) => t.runs).flatMap((l) => l.verticies),
        );
    }

    static stitchToCm = 1 / 100;
    static CmToStitch = 100;
}
