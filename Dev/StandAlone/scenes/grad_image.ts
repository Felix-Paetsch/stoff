import { Embroidery } from "@/Core/embroidery";
import {
    Convolution,
    fast_marching_tensor,
    grid_from_function,
    maching_squares,
    map_windows,
    NumberGrid,
    resample_grid,
} from "@/Core/grid";
import { clahe, ImageIO } from "@/Core/image";
import { Out } from "@/Dev";
import { image_to_grayscale_grid } from "Core/adapters/image_grid";
import { Matrix } from "Core/geometry/matrix";
import { slope_tensor } from "Core/grid/algorithms/gradient";
import { double_run_merge_shapes } from "Core/unstructured/double_run_merge_shapes";

export default async function () {
    let img = await ImageIO.load("out/einstein.png");

    // Image processing

    const gray = img.gray_scale();
    Out.put(gray, "#0_gray");

    const clahe_gray = clahe(gray, 8, 8, 3);
    Out.put(clahe_gray, "#1_clahe");

    const clahe_grid = image_to_grayscale_grid(clahe_gray);

    let convoluted = convolve_median(clahe_grid, 5);
    Out.put(convoluted, "#2_conv");
    convoluted = Convolution.convolve(clahe_grid, Convolution.gaussian_blur(5));
    Out.put(convoluted, "#2_conv1");

    let height_lines_grid = convoluted;
    height_lines_grid.remap_domain_in_place([0, 0, 10, 10]);
    height_lines_grid = resample_grid(height_lines_grid, [500, 500]);
    let speed_map = slope_tensor(height_lines_grid);
    speed_map.map_in_place((m) => {
        return Matrix.Identity().scale(3); //.add(m.scale(5));
    });

    Out.put(speed_map, "#3speed");

    const src_map = grid_from_function(
        "number",
        speed_map.dimensions(),
        () => Infinity,
    );
    src_map.set_value_at_lattice_point([100, 100], 0);

    let eikonal = fast_marching_tensor(src_map, speed_map);
    console.log(eikonal);
    Out.put(eikonal, "#4_eikonal");

    // Height lines

    eikonal.map_in_place((v) => 5000 * v);
    const s = new Embroidery();
    const height_lines = maching_squares(eikonal)
        .map((l) => l.resample(0.3))
        .filter((l) => l.length() > 1);
    height_lines.forEach((l) => s.run(l));

    Out.put(s);

    const t = new Embroidery();
    const merged = double_run_merge_shapes(height_lines);
    t.run(merged);

    Out.put(t);

    return [];
}

function convolve_median(g: NumberGrid, x: number, y?: number): NumberGrid {
    if (!y) {
        y = x;
    }

    return map_windows("number", g, [x, y], (w) => {
        let all_values: number[] = [];
        for (let i = 0; i < x; i++) {
            for (let j = 0; j < y; j++) {
                all_values.push(w([i, j]));
            }
        }
        all_values.sort();
        return all_values[Math.floor(all_values.length / 2)]!;
    });
}
