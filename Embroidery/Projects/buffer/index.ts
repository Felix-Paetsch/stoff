import { DST, FiniteGeometry, Polygon, Sketch } from "@/Core";
import { Embroidery } from "Embroidery/Lib/embroidery";
import { defineEmbroidery } from "Embroidery/types";
import path from "path/win32";
import { polygon_smooth_out } from "ShapeManipulation/smooth_out";

export const BufferDST = defineEmbroidery(
    "Buffer" as const,
    (cfg: {
        file: string;
        buffer: number | number[];
        concavity?: number;
        length_threshold?: number;
        smooth_hull?: number;
        smooth_buffer?: number;
    }) => {
        const embr = Embroidery.from_dst(DST.from_file(cfg.file));

        const res = new Embroidery();
        const viz = new Sketch();

        let hull = FiniteGeometry.concave_hull(embr.runs, {
            concavity: cfg.concavity,
            length_threshold: cfg.length_threshold,
        })!;

        if (cfg.smooth_hull) {
            hull = polygon_smooth_out(hull, cfg.smooth_hull);
        }

        embr.runs.forEach((r) => viz.add_line(r));
        viz.add_line(hull);

        if (cfg.buffer instanceof Array) {
            cfg.buffer.forEach((b) => {
                let buff_line = select_correct_buffer(hull.buffer(b));

                if (cfg.smooth_buffer) {
                    buff_line = polygon_smooth_out(
                        buff_line,
                        cfg.smooth_buffer,
                    );
                }
                buff_line = buff_line.resample_strict(0.05);
                viz.add_line(buff_line);
                res.run(buff_line.to_polyline());
            });
        } else {
            let buff_line = select_correct_buffer(hull.buffer(cfg.buffer));

            if (cfg.smooth_buffer) {
                buff_line = polygon_smooth_out(buff_line, cfg.smooth_buffer);
            }
            buff_line = buff_line.resample_strict(0.05);
            viz.add_line(buff_line);
            res.run(buff_line.to_polyline());
        }

        res.to_dst().to_file("./out/buffer_" + path.basename(cfg.file));

        return [viz, res];
    },
);

function select_correct_buffer(buffer: Polygon[]): Polygon {
    outer: for (let b1 of buffer) {
        for (let b2 of buffer) {
            if (b1 == b2) continue;
            if (!b1.contains(b2)) {
                continue outer;
            }
        }

        return b1;
    }

    throw new Error("Invalid buffers!");
}
