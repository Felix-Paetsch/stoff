import { Embroidery } from "@/Core/embroidery";
import { Convolution, maching_squares, map_windows } from "@/Core/grid";
import { clahe, ImageIO } from "@/Core/image";
import { Out } from "@/Dev";
import { image_to_grayscale_grid } from "Core/adapters/image_grid";

export default async function () {
    // let img = await ImageIO.load("out/einstein.png");
    let img = await ImageIO.load("/home/Felix/stoff/bilder/cdee/dsfsd.webp");

    // Image processing

    const gray = img.gray_scale();
    Out.put(gray, "#0_gray");

    const clahe_gray = clahe(gray, 8, 8, 3);
    Out.put(clahe_gray, "#1_clahe");

    const img_f64 = image_to_grayscale_grid(clahe_gray);
    console.log(Convolution.gaussian_blur(4));
    const convoluted = Convolution.convolve(
        img_f64,
        Convolution.gaussian_blur(3),
    );
    Out.put(convoluted, "#2_conv");

    const kirsch_kernels = Convolution.CompassDirections.map((d) =>
        Convolution.kirsch(d),
    );

    const kirsch_operated = map_windows("number", convoluted, [3, 3], (w) => {
        const entries = kirsch_kernels.map((k) => k.convolve_window(w));
        return Math.max(...entries);
    });

    Out.put(kirsch_operated, "#3_kirsch");

    kirsch_operated.map_in_place((a) => (a > 120 ? 255 : 0));
    Out.put(kirsch_operated, "#4_th");

    kirsch_operated.remap_domain_in_place([0, 0, 10, 10]);

    const shapes = maching_squares(kirsch_operated)
        .filter((l) => l.length() > 0.4)
        .map((l) => l.as_polyline());

    const t = new Embroidery();
    shapes.forEach((l) => t.run(l));
    Out.put(t);

    return [];
}
