import { merge_shapes } from "@/Core/geometry";
import {
    Convolution,
    grid_aspect_ratio,
    lattice_point_at_vector,
    map_grid,
    map_windows,
    marching_squares,
} from "@/Core/grid";
import { ImageIO } from "@/Core/image";
import { Out } from "@/Dev";
import { image_to_grayscale_grid } from "Core/adapters/image_grid";
import { Embroidery } from "Core/embroidery/embroidery";

export default async function () {
    let img = await ImageIO.load("/home/Felix/stoff/bilder/cdee/dsfsd.webp");

    // Image processing

    const gray = img.gray_scale();
    Out.put(gray, "#0_gray");

    const img_f64 = image_to_grayscale_grid(gray);
    const convoluted = Convolution.convolve(
        img_f64,
        Convolution.gaussian_blur(20),
    );

    Out.put(convoluted, "#2_conv");

    const downscaled = convoluted.with_new_dimensions({
        lattice_dimensions: [
            Math.round(700 * grid_aspect_ratio(convoluted)),
            700,
        ],
    });

    Out.put(downscaled, "#2.5_down");

    const kirsch_kernels = Convolution.CompassDirections.map((d) =>
        Convolution.kirsch(d),
    );

    const kirsch_operated = map_windows("number", downscaled, [3, 3], (w) => {
        const entries = kirsch_kernels.map((k) => k.convolve_window(w));
        return Math.max(...entries);
    });
    Out.put(kirsch_operated, "#3_kirsch");

    const kirsch_mapped = map_grid("number", kirsch_operated, (num, v) => {
        const offset = 1;
        const [w, h] = kirsch_operated.dimensions_ref.lattice_dimensions;
        const thd = 120;

        let surrounding_brightness = -num;
        const lp = lattice_point_at_vector(kirsch_operated, v);

        for (
            let i = Math.max(0, lp[0] - offset);
            i < Math.min(lp[0] + offset + 1, w);
            i++
        ) {
            for (
                let j = Math.max(0, lp[1] - offset);
                j < Math.min(lp[1] + offset + 1, h);
                j++
            ) {
                surrounding_brightness +=
                    kirsch_operated.value_at_lattice_point([i, j]);
            }
        }

        if (surrounding_brightness > offset * offset * 0.6 * thd && num > thd) {
            return 255;
        } else {
            return 0;
        }
    });

    Out.put(kirsch_mapped, "#4_kirsch_mapped");
    const hl = marching_squares(kirsch_mapped, 100)
        .map((l) => l.map((v) => v.scale(0.01)))
        .filter((l) => l.length() > 0.5);

    // const merged = merge_shapes(hl);
    const merged = merge_shapes(hl);
    const embr = new Embroidery();
    embr.run(merged);
    Out.put(embr);

    // const verts: Vector[] = [];
    // iter_windows(kirsch_operated, [3, 3], (window, tl) => {
    //     const offset = 1;
    //     const thd = 120;
    //
    //     let surrounding_brightness = -window([1, 1]);
    //
    //     for (let i = 0; i < offset + 1; i++) {
    //         for (let j = 0; j < offset + 1; j++) {
    //             surrounding_brightness += window([i, j]);
    //         }
    //     }
    //
    //     if (
    //         surrounding_brightness > offset * offset * 0.6 * thd &&
    //         window([1, 1]) > thd
    //     ) {
    //         verts.push(vector_at_lattice_point(kirsch_operated, tl));
    //     }
    // });
    //
    // const mst = minimum_spanning_tree_on_vertices(verts);
    // console.log("MST done!");
    // console.log(mst.nodes.length);
    // const pl = double_run_graph(mst);
    // console.log("PL done!");
    // const embr = new Embroidery();
    // embr.run(pl);
    // Out.put(embr);

    return [];
}
