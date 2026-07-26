import { partition_unity_gauss, Spline } from "@/Core/numerics";
import { Out } from "@/Dev";
import { image_to_grayscale_grid } from "ProcedualArt/primitives/adapters";
import { Embroidery } from "ProcedualArt/primitives/embroidery";
import {
    Convolution,
    fast_marching,
    grid_from_function,
    map_grid,
    map_windows,
    marching_squares,
    NumberGrid,
    resample_grid,
} from "ProcedualArt/primitives/grid";
import { clahe, ImageIO } from "ProcedualArt/primitives/image";
import { double_run_merge_shapes } from "ProcedualArt/primitives/pathing";

function map_brightness(v: number): number {
    v = (v / 255) * 100;

    const important_hsl_numbers = [30, 61, 75, 80];
    const bad_hsl_numbers = [44, 56, 65, 77];

    const partition = partition_unity_gauss(
        important_hsl_numbers.concat(bad_hsl_numbers),
    );

    const importance = partition(v);

    let good = 0;
    for (let i = 0; i < important_hsl_numbers.length; i++) {
        good += importance[i]!;
    }

    const bad = 255 * (1 - good) + 1;

    return bad;
}

function map_brightness_to_speed(v: number): number {
    const samples: Spline.SamplePoint[] = [
        [0, 200],
        [8, 500],
        [30, 1000],
        [60, 2000],
        [100, 10000],
    ];

    const remap_method = Spline.akima(samples);

    return remap_method((v / 255) * 100);
}

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

    // Eikonal

    const feature_map = map_grid("number", height_lines_grid, map_brightness);
    Out.put(feature_map, "#2.5_features");
    const speed_map = map_grid("number", feature_map, map_brightness_to_speed);
    Out.put(speed_map, "#3_speed");

    const src_map = grid_from_function(
        "number",
        convoluted.dimensions(),
        () => Infinity,
    );
    src_map.set_value_at_lattice_point([0, 0], 0);

    let eikonal = fast_marching(src_map, speed_map);
    Out.put(eikonal, "#4_eikonal");

    // Height lines

    eikonal.map_in_place((v) => 5000 * v);
    const s = new Embroidery();
    const height_lines = marching_squares(eikonal)
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
