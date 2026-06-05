import { Image } from "@/Core/files";
import { BooleanGrid } from "../grids/boolean_grid";
import { NumberGrid } from "../grids/number_grid";
import { InternalGrid } from "../grids/types";
import { Vec3Grid } from "../grids/vec3_grid";
import { Vec3UInt8Grid } from "../grids/vec3u8_grid";
import { VectorGrid } from "../grids/vector_grid";
import { map_vec3, map_vec3_u8 } from "../utils/map";
import { render_boolean_grid } from "./boolean_grid";
import { render_number_grid } from "./number_grid";
import { render_vec3_grid } from "./vec3_grid";

export function render_internal_grid(
    g: InternalGrid,
    img_dimensions: [number, number] = [500, 500],
) {
    if (g instanceof NumberGrid) {
        return render_number_grid(g, img_dimensions);
    }
    if (g instanceof BooleanGrid) {
        return render_boolean_grid(g, img_dimensions);
    }
    if (g instanceof Vec3Grid) {
        return render_vec3_grid(g, img_dimensions);
    }
    if (g instanceof VectorGrid) {
        return render_vec3_grid(
            map_vec3(g, (v) => [v.x, v.y, 0]),
            img_dimensions,
        );
    }
    if (g instanceof Vec3UInt8Grid) {
        return new Image(g);
    }
    return new Image(map_vec3_u8(g, (v) => [v, v, v]));
}
