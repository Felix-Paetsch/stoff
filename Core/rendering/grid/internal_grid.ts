import { InternalGrid, map_grid } from "@/Core/grid";
import { Image } from "@/Core/image";
import { render_boolean_grid } from "./boolean_grid";
import { render_number_grid } from "./number_grid";
import { render_vec3_grid } from "./vec3_grid";

export function render_internal_grid(
    g: InternalGrid,
    img_dimensions: [number, number] = [500, 500],
): Image {
    if (g.type == "number") {
        return render_number_grid(g, img_dimensions);
    }
    if (g.type == "vec3") {
        return render_vec3_grid(g);
    }
    if (g.type == "vector") {
        return render_vec3_grid(map_grid("vec3", g, (v) => [v.x, v.y, 0]));
    }
    return render_boolean_grid(g);
}
