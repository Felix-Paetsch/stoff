import { ShapeAlgorithms } from "@/Algorithms";
import { DST, Polygon } from "@/Core";
import { Out } from "@/Dev";
import { Embroidery } from "Embroidery/Lib/embroidery";
import { defineEmbroidery } from "Embroidery/types";
import path from "path/win32";

export const BufferOutlineDST = defineEmbroidery(
    "BufferOutline" as const,
    (cfg: {
        file: string;
        buffer: number | number[];
        smooth_buffer?: number;
    }) => {
        const embr = Embroidery.from_dst(DST.from_file(cfg.file));
        const res = new Embroidery();

        let outline = embr.runs[0]!.to_polygon();

        if (cfg.buffer instanceof Array) {
            cfg.buffer.forEach((b) => {
                const buffer_res = outline.buffer(b);
                let buff_line = select_correct_buffer(buffer_res);

                if (cfg.smooth_buffer) {
                    buff_line = ShapeAlgorithms.smooth_out(
                        buff_line,
                        cfg.smooth_buffer,
                    );
                }
                buff_line = buff_line.resample(0.05);
                res.run(buff_line.to_polyline());
            });
        } else {
            let buff_line = select_correct_buffer(outline.buffer(cfg.buffer));

            if (cfg.smooth_buffer) {
                buff_line = ShapeAlgorithms.smooth_out(
                    buff_line,
                    cfg.smooth_buffer,
                );
            }
            buff_line = buff_line.resample(0.05);
            res.run(buff_line.to_polyline());
        }

        res.to_dst().to_file("./out/buffer_" + path.basename(cfg.file));

        res.color_change("blue");
        res.run(...embr.runs);
        Out.put(res);

        return res;
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
