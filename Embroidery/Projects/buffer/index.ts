import { DST, FiniteGeometry, Polygon, SVG_Builder } from "@/Core";
import { Out } from "@/Dev";
import { smooth_out } from "Algorithms/smooth_out";
import { Embroidery } from "Embroidery/Lib/embroidery";
import { defineEmbroidery } from "Embroidery/types";
import { writeFileSync } from "fs";
import path from "path/win32";

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
        Out.put(embr);

        const res = new Embroidery();

        let hull = FiniteGeometry.concave_hull(embr.runs, {
            concavity: cfg.concavity,
            length_threshold: cfg.length_threshold,
        })!;

        if (cfg.smooth_hull) {
            hull = smooth_out(hull, cfg.smooth_hull);
        }

        if (cfg.buffer instanceof Array) {
            cfg.buffer.forEach((b) => {
                let buff_line = select_correct_buffer(hull.buffer(b));

                if (cfg.smooth_buffer) {
                    buff_line = smooth_out(buff_line, cfg.smooth_buffer);
                }
                buff_line = buff_line.resample(0.05);
                res.run(buff_line.to_polyline());
            });
        } else {
            let buff_line = select_correct_buffer(hull.buffer(cfg.buffer));

            if (cfg.smooth_buffer) {
                buff_line = smooth_out(buff_line, cfg.smooth_buffer);
            }
            buff_line = buff_line.resample(0.05);
            res.run(buff_line.to_polyline());
        }

        res.to_dst().to_file("./out/buffer_" + path.basename(cfg.file));

        const bb = res.bounding_box();
        const svg = new SVG_Builder(
            bb.width * Embroidery.CmToStitch,
            bb.height * Embroidery.CmToStitch,
            [
                bb.top_left.scale(Embroidery.CmToStitch),
                bb.bottom_right.scale(Embroidery.CmToStitch),
            ],
            0,
        );

        res.runs.forEach((r) => {
            const mapped_line = r.map((v) => v.scale(Embroidery.CmToStitch));
            svg.render_polygon(mapped_line.as_polygon());
        });

        res.color_change("red");
        embr.runs.forEach((r) => res.run(r));
        Out.put(res);

        writeFileSync(
            "./out/buffer_" + path.parse(cfg.file).name + ".svg",
            svg.svg(),
        );

        return;
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
