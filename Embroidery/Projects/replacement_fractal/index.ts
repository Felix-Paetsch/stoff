import { LinearTransform, Polyline, Vector } from "@/Core";
import { Embroidery } from "Embroidery/Lib/embroidery";
import { defineEmbroidery } from "Embroidery/types";

export const ReplacementFractal = defineEmbroidery(
    "ReplacementFractal" as const,
    (_cfg: {}) => {
        const shape = replacement_fractal(
            new Polyline([new Vector(0, 0), new Vector(0, 4)]),
            new Polyline([
                new Vector(0, 0),
                new Vector(1, 0),
                new Vector(1, 1),
            ]),
            12,
        );

        const embr = new Embroidery();
        embr.color_change("blue");
        embr.run(shape);

        embr.to_dst().to_file("./out/out.dst");

        return embr;
    },
);

export function replacement_fractal(
    l: Polyline,
    replace_with: Polyline,
    iterations: number = 1,
): Polyline {
    if (iterations == 1) {
        const verticies = l.verticies;

        const vert: Vector[] = [verticies[0]!];
        for (let i = 1; i < verticies.length; i++) {
            let trafo = LinearTransform.affine_orthogonal(
                [replace_with.first()!, replace_with.last()!],
                [verticies[i - 1]!, verticies[i]!],
            );

            if (i % 2 == 0) {
                trafo = LinearTransform.compose(
                    trafo,
                    LinearTransform.mirror([verticies[i - 1]!, verticies[i]!]),
                );
            }
            vert.push(...replace_with.map(trafo).verticies.slice(1));
        }
        return new Polyline(vert);
    }

    for (let i = 0; i < iterations; i++) {
        l = replacement_fractal(l, replace_with, 1);
    }

    return l;
}
