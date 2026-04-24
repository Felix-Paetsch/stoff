import { Line, Shape, Sketch, Vector } from "@/Core";
import { Embroidery } from "Embroidery/Lib/embroidery";
import { defineEmbroidery } from "Embroidery/types";

export type TestConfig = {};

export const TestEmbr = defineEmbroidery(
    "Test" as const,
    (_cfg: TestConfig) => {
        const sT = new Sketch();

        const p1 = sT.add_point(0, 0);
        const p2 = sT.add_point(5 * Embroidery.CmToStitch, 0);

        for (let i = 0; i < 4; i++) {
            for (let j = 1; j < 4; j++) {
                const shape = Shape.from_function(
                    (t) =>
                        new Vector(
                            t * ((j % 2) * 2 - 1),
                            Math.log(j) * Math.sin(Math.PI * t * i),
                        ),
                );
                const l = new Line([p1, p2], shape);
                l.update_shape(l.shape.resample_smooth(0, 4));
            }
        }

        const embr = new Embroidery([
            {
                color: "blue",
                runs: sT.lines().map((l) => l.shape.as_polyline()),
            },
        ]);

        return [embr, sT];
    },
);
