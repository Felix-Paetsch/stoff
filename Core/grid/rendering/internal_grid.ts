import { GrayImage, Image, RGBImage } from "Core/image/types";
import { Grid } from "../index";
import { InternalGrid } from "../types";
import { render_boolean_grid } from "./boolean_grid";
import { render_number_grid } from "./number_grid";
import { render_vec3_grid } from "./vec3_grid";

export function render_internal_grid(
    g: InternalGrid,
    img_dimensions: [number, number] = [500, 500],
): Image {
    if (g.type == "f64") {
        return render_number_grid(g, img_dimensions);
    }
    if (g.type == "vec3u8") {
        return new RGBImage(Grid.lazy_with_new_dimensions(img_dimensions, g));
    }
    if (g.type == "vec3") {
        return render_vec3_grid(g);
    }
    if (g.type == "u8") {
        return new GrayImage(Grid.lazy_with_new_dimensions(img_dimensions, g));
    }
    if (g.type == "vector") {
        return render_vec3_grid(Grid.map("vec3", g, (v) => [v.x, v.y, 0]));
    }
    return render_boolean_grid(g);
}
