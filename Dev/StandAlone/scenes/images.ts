import { ImageIO } from "@/Core/files";
import { FiniteGeometry, Vector } from "@/Core/geometry";
import { Grid, GridAlgorithms } from "@/Core/grid";
import { clahe } from "@/Core/images";
import { Sketch } from "@/Core/sketch";
import { Out } from "@/Dev";
import { merge_shapes } from "Core/geometry/algorithms/merge_shapes";
import { Convolution } from "Core/grid/algorithms/index";
import { UInt8Grid } from "Core/grid/types";
import { partition_unity_gauss } from "Core/numerics/index";
import { Embroidery } from "Embroidery/Lib/embroidery";

function map_brightness(v: number): number {
    v = (v / 255) * 100;

    const important_hsl_numbers = [15, 20, 70];
    const bad_hsl_numbers = [50];

    const partition = partition_unity_gauss(
        important_hsl_numbers.concat(bad_hsl_numbers),
    );

    const importance = partition(v);

    let good = 0;
    for (let i = 0; i < important_hsl_numbers.length; i++) {
        good += importance[i]!;
    }

    const bad = 1 - good;

    return bad * 255 + 50;
}

export default async function () {
    let img = await ImageIO.load("out/einstein.png");

    // Image processing

    const gray = img.gray_scale().pixel_grid;
    Out.put(gray, "#0_gray");

    const clahe_gray = clahe(gray, 8, 8, 3);
    Out.put(clahe_gray, "#1_clahe");

    let convoluted = convolve_median(clahe_gray, 5);
    Out.put(convoluted, "#2_conv");
    convoluted = Convolution.convolve_u8(
        clahe_gray,
        Convolution.gaussian_blur(5),
    );
    Out.put(convoluted, "#2_conv1");

    const sk = new Sketch();
    sk.add_line(FiniteGeometry.circle(Vector.ZERO, 5));
    Out.put(sk, "#1_sk");

    let height_lines_grid = convoluted;

    height_lines_grid.remap_domain_in_place([0, 0, 10, 10]);
    height_lines_grid = Grid.resample(height_lines_grid, [500, 500]);

    // Eikonal

    const speed_map = Grid.map("f64", height_lines_grid, map_brightness);
    Out.put(speed_map, "#3_speed");

    const src_map = Grid.from_function(
        "f64",
        convoluted.dimensions(),
        () => Infinity,
    );
    src_map.set_value_at_lattice_point([0, 0], 0);

    let eikonal = GridAlgorithms.fast_marching(src_map, speed_map);
    Out.put(eikonal, "#4_eikonal");

    // Height lines

    eikonal.map_in_place((v) => 1000 * v);
    const s = new Embroidery();
    const height_lines = GridAlgorithms.maching_squares(eikonal);
    height_lines.forEach((l) => s.run(l));

    Out.put(s);

    const t = new Embroidery();
    const merged = merge_shapes(height_lines);
    t.run(merged.resample(0.4));

    Out.put(t);

    return [];
}

function convolve_median(g: UInt8Grid, x: number, y?: number): UInt8Grid {
    if (!y) {
        y = x;
    }

    return Grid.map_windows("u8", g, [x, y], (w) => {
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
