import { Image } from "@/Core/files";
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
        return new Image(g, img_dimensions);
    }
    if (g.type == "vec3") {
        return render_vec3_grid(g);
    }
    if (g.type == "u8") {
        return new Image(Grid.map("vec3u8", g, (v) => [v, v, v]));
    }
    if (g.type == "vector") {
        return render_vec3_grid(Grid.map("vec3", g, (v) => [v.x, v.y, 0]));
    }
    return render_boolean_grid(g);
}
