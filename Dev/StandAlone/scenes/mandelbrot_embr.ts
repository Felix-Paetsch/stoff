import { GeometryAlgorithms, Polygon } from "@/Core/geometry";
import { Grid, GridAlgorithms } from "@/Core/grid";
import { Sketch } from "@/Core/sketch";
import { Performance } from "@/Dev";
import { Vector } from "Core/geometry/vector";
import { Embroidery } from "Embroidery/Lib/embroidery";

export default function () {
    const num_grid = Grid.from_function(
        "f64",
        {
            domain_dimensions: [-2, -2, 4, 4],
            lattice_dimensions: [500, 500],
        },
        (c: Vector) => {
            let z = Vector.ZERO;

            for (let i = 0; i < 1000; i++) {
                z = z.cplx_mult(z).add(c);
                if (z.length_squared() > 4) return i;
            }

            return 1000;
        },
    );

    num_grid.remap_domain_in_place([0, 0, 10, 10]);
    // Out.file(Grid.GridRendering.number_grid_png(num_grid), "escape vel.png");

    const outlines: Polygon[] = [];
    const s = new Sketch();
    [1, 2, 3, 4, 5, 7, 9, 50, 1000].forEach((x) => {
        const bool_grid = Grid.map("boolean", num_grid, (v) => v >= x);

        const outline = GridAlgorithms.concave_outline(bool_grid, {
            concavity: 1.2,
        }).resample(0.3);

        s.add_line(outline);
        outlines.push(outline);
    });

    let res = Performance.time(
        () => GeometryAlgorithms.merge_shapes(outlines),
        "Merge",
    );

    const e = new Embroidery();
    res = res.as_polygon().move_root([0.15, "relative"]);
    const run = res.as_polyline().resample_strict(0.3, Math.PI / 3);
    e.run(run);
    console.log(e.size());

    // const e = new Sketch();
    // e.add_line(outlines[0]!);
    // e.add_line(outlines[outlines.length - 1]!);
    //
    // const closest = Shape.closest_shape_positions(
    //     outlines[0]!,
    //     outlines[outlines.length - 1]!,
    // )!;
    // SketchRendering.set_fill(e.add_point(closest[0]!.vec), "red");
    // SketchRendering.set_fill(e.add_point(closest[1]!.vec), "red");
    //
    // let presum_closer = outlines[0]!.vertices[23]!;
    //
    // let closest_pos =
    //     outlines[outlines.length - 1]!.closest_shape_position(presum_closer)!;
    // console.log(closest_pos, closest_pos.vec.distance(presum_closer));
    //
    // SketchRendering.set_fill(e.add_point(presum_closer), "green");

    return [e, s];
}
