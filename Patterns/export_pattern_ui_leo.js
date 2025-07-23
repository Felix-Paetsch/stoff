import SewingSketch from "../Core/PatternLib/sewing_sketch.js";

export default (design_config) => {
    const s = new SewingSketch();
    s.data = design_config;

    const p1 = s.point(0, 0);
    const p2 = s.point(-10, -10);
    const p3 = s.point(-21, -11);
    const p4 = s.point(-30, -5);
    const p5 = s.point(-35, 5);
    const p6 = s.point(-30, 20);

    const p65 = s.point(-10, 40);
    const p7 = s.point(0, 50);
    const p75 = s.point(10, 40);

    const p8 = s.point(30, 20);
    const p9 = s.point(35, 5);
    const p10 = s.point(30, -5);
    const p11 = s.point(21, -11);
    const p12 = s.point(10, -10);

    let lines = [
        s.line_between_points(p1, p2),
        s.line_between_points(p2, p3),
        s.line_between_points(p3, p4),
        s.line_between_points(p4, p5),
        s.line_between_points(p5, p6),
        s.line_between_points(p6, p65),
        s.line_between_points(p65, p7),
        s.line_between_points(p7, p75),
        s.line_between_points(p75, p8),
        s.line_between_points(p8, p9),
        s.line_between_points(p9, p10),
        s.line_between_points(p10, p11),
        s.line_between_points(p11, p12),
        s.line_between_points(p12, p1),
    ];

    for (let i = 0; i < lines.length; i++) {
        let fraction = i / lines.length;
        fraction += 0.2;
        if (fraction >= 1) {
            fraction -= 1;
        }

        // Determine the RGB components
        let r, g, b;
        if (fraction < 1 / 6) {
            // Red to Yellow (Increase Green)
            r = 255;
            g = 255 * fraction * 6;
            b = 0;
        } else if (fraction < 2 / 6) {
            // Yellow to Green (Reduce Red)
            r = 255 * (1 - (fraction - 1 / 6) * 6);
            g = 255;
            b = 0;
        } else if (fraction < 3 / 6) {
            // Green to Cyan (Increase Blue)
            r = 0;
            g = 255;
            b = 255 * (fraction - 2 / 6) * 6;
        } else if (fraction < 4 / 6) {
            // Cyan to Blue (Reduce Green)
            r = 0;
            g = 255 * (1 - (fraction - 3 / 6) * 6);
            b = 255;
        } else if (fraction < 5 / 6) {
            // Blue to Magenta (Increase Red)
            r = 255 * (fraction - 4 / 6) * 6;
            g = 0;
            b = 255;
        } else {
            // Magenta to Red (Reduce Blue)
            r = 255;
            g = 0;
            b = 255 * (1 - (fraction - 5 / 6) * 6);
        }

        const total_sum = r + g + b;
        const scale_factor = 255 / total_sum;
        r *= scale_factor;
        g *= scale_factor;
        b *= scale_factor;

        // Set the color
        lines[i].set_color(
            `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
        );
    }

    for (let i = 1; i < Math.random() * lines.length; i++) {
        const new_lines = [];
        for (let j = 0; j < lines.length - 1; j++) {
            new_lines.push(
                s.interpolate_lines(lines[j], lines[(j + 1) % lines.length], 0)
            );
        }
        lines = new_lines;
    }
    s.dev.start_recording("/wha");
    s.dev.at_url("/test");

    s.data = design_config;
    return s;
};
