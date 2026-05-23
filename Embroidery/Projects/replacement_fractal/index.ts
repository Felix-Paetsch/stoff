import { Geometry } from "@/Core";
import { Embroidery } from "Embroidery/Lib/embroidery";
import { defineEmbroidery } from "Embroidery/types";

export const ReplacementFractal = defineEmbroidery(
    "ReplacementFractal" as const,
    (_cfg: {}) => {
        const shape = replacement_fractal(
            new Geometry.Polyline([
                new Geometry.Vector(0, 0),
                new Geometry.Vector(0, 4),
            ]),
            new Geometry.Polyline([
                new Geometry.Vector(0, 0),
                new Geometry.Vector(1, 0),
                new Geometry.Vector(1, 1),
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
    l: Geometry.Polyline,
    replace_with: Geometry.Polyline,
    iterations: number = 1,
): Geometry.Polyline {
    if (iterations == 1) {
        const vertices = l.vertices;

        const vert: Geometry.Vector[] = [vertices[0]!];
        for (let i = 1; i < vertices.length; i++) {
            let trafo = Geometry.LinearTransform.affine_orthogonal(
                [replace_with.first()!, replace_with.last()!],
                [vertices[i - 1]!, vertices[i]!],
            );

            if (i % 2 == 0) {
                trafo = Geometry.LinearTransform.compose(
                    trafo,
                    Geometry.LinearTransform.mirror([
                        vertices[i - 1]!,
                        vertices[i]!,
                    ]),
                );
            }
            vert.push(...replace_with.map(trafo).vertices.slice(1));
        }
        return new Geometry.Polyline(vert);
    }

    for (let i = 0; i < iterations; i++) {
        l = replacement_fractal(l, replace_with, 1);
    }

    return l;
}
