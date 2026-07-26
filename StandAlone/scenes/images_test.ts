import { partition_unity_gauss, Spline } from "@/Core/numerics";
import { Out } from "@/Dev";
import { image_to_grayscale_grid } from "ProcedualArt/primitives/adapters";
import { Embroidery } from "ProcedualArt/primitives/embroidery";
import {
    fast_marching,
    grid_from_function,
    map_grid,
    marching_squares,
    resample_grid,
} from "ProcedualArt/primitives/grid";
import { ImageIO } from "ProcedualArt/primitives/image/";
import { double_run_merge_shapes_advanced } from "ProcedualArt/primitives/pathing";

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

    const gray = image_to_grayscale_grid(img);
    gray.remap_domain_in_place([0, 0, 10, 10]);
    const height_lines_grid = resample_grid(gray, [200, 200]);

    // Eikonal

    const feature_map = map_grid("number", height_lines_grid, map_brightness);
    Out.put(feature_map, "#2.5_features");
    const speed_map = map_grid("number", feature_map, map_brightness_to_speed);
    Out.put(speed_map, "#3_speed");

    const src_map = grid_from_function(
        "number",
        speed_map.dimensions(),
        () => Infinity,
    );
    src_map.set_value_at_lattice_point([0, 0], 0);

    let eikonal = fast_marching(src_map, speed_map);
    Out.put(eikonal, "#4_eikonal");

    // Height lines

    eikonal.map_in_place((v) => 500 * v);
    const s = new Embroidery();
    const height_lines = marching_squares(eikonal)
        .filter((l) => l.length() > 0)
        .map((l) => l.as_polyline());
    height_lines.forEach((l) => s.run(l));

    Out.put(s);

    const t = new Embroidery();
    height_lines.forEach((l) => console.log(l.vertex_count()));

    const merged = double_run_merge_shapes_advanced(height_lines);
    merged.forEach((m) => {
        t.run(m.resample(0.3));
    });

    Out.put(t);

    return [];
}
