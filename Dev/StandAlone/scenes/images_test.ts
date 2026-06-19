import { Numerics } from "@/Core";
import { ImageIO } from "@/Core/files";
import { Grid, GridAlgorithms } from "@/Core/grid";
import { Out } from "@/Dev";
import { double_run_merge_shapes_advanced } from "Core/geometry/algorithms/double_run_merge_shapes";
import { partition_unity_gauss } from "Core/numerics/index";
import { SamplePoint } from "Core/numerics/spline";
import { Embroidery } from "Embroidery/Lib/embroidery";

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
    const samples: SamplePoint[] = [
        [0, 200],
        [8, 500],
        [30, 1000],
        [60, 2000],
        [100, 10000],
    ];

    const remap_method = Numerics.Spline.akima(samples);

    return remap_method((v / 255) * 100);
}

export default async function () {
    let img = await ImageIO.load("out/einstein.png");

    // Image processing

    const gray = img.gray_scale().pixel_grid;
    gray.remap_domain_in_place([0, 0, 10, 10]);
    const height_lines_grid = Grid.resample(gray, [200, 200]);

    // Eikonal

    const feature_map = Grid.map("f64", height_lines_grid, map_brightness);
    Out.put(feature_map, "#2.5_features");
    const speed_map = Grid.map("f64", feature_map, map_brightness_to_speed);
    Out.put(speed_map, "#3_speed");

    const src_map = Grid.from_function(
        "f64",
        speed_map.dimensions(),
        () => Infinity,
    );
    src_map.set_value_at_lattice_point([0, 0], 0);

    let eikonal = GridAlgorithms.fast_marching(src_map, speed_map);
    Out.put(eikonal, "#4_eikonal");

    // Height lines

    eikonal.map_in_place((v) => 500 * v);
    const s = new Embroidery();
    const height_lines = GridAlgorithms.maching_squares(eikonal)
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
