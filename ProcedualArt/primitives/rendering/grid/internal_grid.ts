import { InternalGrid } from "ProcedualArt/primitives/grid";
import { Image } from "ProcedualArt/primitives/image";
import { render_boolean_grid } from "./boolean_grid";
import { render_matrix_grid } from "./matrix_grid";
import { render_number_grid } from "./number_grid";
import { render_vec3_grid } from "./vec3_grid";
import { render_vector_grid } from "./vector_grid";
import { GridRenderDimensionsArgs } from "./with_callback";

export function render_internal_grid(
    g: InternalGrid,
    img_dimensions: GridRenderDimensionsArgs = null,
): Image {
    if (g.type == "number") {
        return render_number_grid(g, img_dimensions);
    }
    if (g.type == "vec3") {
        return render_vec3_grid(g, img_dimensions);
    }
    if (g.type == "vector") {
        return render_vector_grid(g, img_dimensions);
    }
    if (g.type == "matrix") {
        return render_matrix_grid(g, img_dimensions);
    }
    return render_boolean_grid(g);
}
