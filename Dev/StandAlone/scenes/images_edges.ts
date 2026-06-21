import { ImageIO } from "@/Core/files";
import { clahe } from "@/Core/images";
import { Out } from "@/Dev";
import { Convolution } from "Core/grid/algorithms/index";
import { Grid, GridAlgorithms } from "Core/grid/index";
import { Embroidery } from "Embroidery/Lib/embroidery";

export default async function () {
    // let img = await ImageIO.load("out/einstein.png");
    let img = await ImageIO.load("/home/Felix/stoff/bilder/cdee/dsfsd.webp");

    // Image processing

    const gray = img.gray_scale().pixel_grid;
    Out.put(gray, "#0_gray");

    const clahe_gray = clahe(gray, 8, 8, 3);
    Out.put(clahe_gray, "#1_clahe");

    const img_f64 = Grid.UInt8_to_f64(img.gray_scale().pixel_grid);
    console.log(Convolution.gaussian_blur(4));
    const convoluted = Convolution.convolve(
        img_f64,
        Convolution.gaussian_blur(3),
    );
    Out.put(convoluted, "#2_conv");

    const kirsch_kernels = Convolution.CompassDirections.map((d) =>
        Convolution.kirsch(d),
    );

    const kirsch_operated = Grid.map_windows("f64", convoluted, [3, 3], (w) => {
        const entries = kirsch_kernels.map((k) => k.convolve_window(w));
        return Math.max(...entries);
    });

    Out.put(kirsch_operated, "#3_kirsch");

    kirsch_operated.map_in_place((a) => (a > 120 ? 255 : 0));
    Out.put(kirsch_operated, "#4_th");

    kirsch_operated.remap_domain_in_place([0, 0, 10, 10]);

    const shapes = GridAlgorithms.maching_squares(kirsch_operated)
        .filter((l) => l.length() > 0.4)
        .map((l) => l.as_polyline());

    const t = new Embroidery();
    shapes.forEach((l) => t.run(l));
    Out.put(t);

    //
    // const merged = double_run_merge_shapes(height_lines);
    // t.run(merged);
    //
    // Out.put(t);

    return [];
}
