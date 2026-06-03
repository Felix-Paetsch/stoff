import * as Color from "@/Core/colors";
import {
    Grid,
    GridAlgorithms,
    GridRendering,
    Vec3,
    Vec3Grid,
} from "@/Core/grid";
import { Sketch } from "@/Core/sketch";
import { Out } from "@/Dev";
import sharp from "sharp";

export default async function () {
    let img = await load_image("out/einstein.png");
    let speed_grid = img.map((i) => Color.toGrayScale(Color.fromRgb(i)));

    const im = GridRendering.render_number_grid(speed_grid);
    Out.put(im, "einstein.png");

    let times_grid = Grid.with_same_dimensions(speed_grid, () => Infinity);
    times_grid.set_value_at_lattice_point(
        [
            speed_grid.lattice_dimensions()[0] / 2,
            speed_grid.lattice_dimensions()[1] / 2,
        ],
        0,
    );

    let arrival_times = GridAlgorithms.fast_marching(times_grid, speed_grid);
    const im2 = GridRendering.render_number_grid(arrival_times);
    Out.put(im2, "#einstein_arr.png");

    arrival_times.map_in_place((v) => v * 3);
    const s = new Sketch();
    const height_lines = GridAlgorithms.maching_squares(arrival_times);

    height_lines.forEach((l) => s.add_line(l));

    return s;
}

async function load_image(path: string): Promise<Vec3Grid> {
    const { data, info } = await sharp(path)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

    const grid: Vec3[] = [];

    for (let y = 0; y < info.height; y++) {
        for (let x = 0; x < info.width; x++) {
            const idx = (y * info.width + x) * info.channels;
            grid.push([data[idx]!, data[idx + 1]!, data[idx + 2]!]);
        }
    }

    return new Vec3Grid(
        {
            lattice_dimensions: [info.width, info.height],
            domain_dimensions: [0, 0, info.width - 1, info.height - 1],
        },
        grid,
    );
}
