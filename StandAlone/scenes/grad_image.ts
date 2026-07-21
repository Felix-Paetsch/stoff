import { Out } from "@/Dev";
import { Matrix } from "Core/geometry/matrix";
import { image_to_grayscale_grid } from "ProcedualArt/adapters/image_grid";
import { Embroidery } from "ProcedualArt/embroidery";
import {
    Convolution,
    fast_marching_tensor,
    grid_aspect_ratio,
    grid_from_function,
    marching_squares,
} from "ProcedualArt/grid";
import { slope_tensor } from "ProcedualArt/grid/algorithms/gradient";
import { clahe, ImageIO } from "ProcedualArt/image";
import { double_run_merge_shapes } from "ProcedualArt/unstructured/double_run_merge_shapes";

export default async function () {
    let img = await ImageIO.load("out/einstein.png");

    // Image processing

    const gray = img.gray_scale();
    Out.put(gray, "#0_original_grayscale[img]");
    const clahe_gray = clahe(gray, 8, 8, 3);
    Out.put(clahe_gray, "#1_clahe[img]");

    const clahe_grid = image_to_grayscale_grid(clahe_gray);
    clahe_grid.remap_domain_in_place({
        width: 10,
    });
    const convoluted = Convolution.convolve(
        clahe_grid,
        Convolution.gaussian_blur(5),
    );
    Out.put(convoluted, "#2_convoluted[img]");

    console.log(grid_aspect_ratio(convoluted));
    let height_lines_grid = convoluted.with_new_dimensions({
        lattice_dimensions: [
            Math.round(500 * grid_aspect_ratio(convoluted)),
            500,
        ],
    });
    let speed_map = slope_tensor(height_lines_grid);
    Out.put(speed_map, "#3_slopes");

    speed_map.map_in_place((m) => {
        console.log(m.eigenvalues());
        return m.scale(0.001).add(Matrix.Scalar(3)).invert();
    });

    Out.put(speed_map, "#4_slopes");

    const src_map = grid_from_function(
        "number",
        speed_map.dimensions(),
        () => Infinity,
    );
    src_map.set_value_at_lattice_point([0, 0], 0);

    // const speed_map_1d = map_grid("number", speed_map, (m) => {
    //     const [e, f] = m.eigenvalues();
    //     return Math.max(255 - (100 * (e! + f!)) / 2, 1);
    // });
    // Out.put(speed_map_1d, "#4_speeds_1d");

    let eikonal = fast_marching_tensor(src_map, speed_map);
    // let eikonal = fast_marching(src_map, speed_map_1d);
    Out.put(eikonal, "#5_eikonal_1d");

    eikonal.map_in_place((v) => v);
    const s = new Embroidery();
    const height_lines = marching_squares(eikonal)
        .map((l) => l.resample(0.3))
        .filter((l) => l.length() > 1);

    console.log(height_lines.length);
    height_lines.forEach((l) => s.run(l));

    Out.put(s);

    const t = new Embroidery();
    const merged = double_run_merge_shapes(height_lines);
    t.run(merged);

    Out.put(t);

    return [];
}
