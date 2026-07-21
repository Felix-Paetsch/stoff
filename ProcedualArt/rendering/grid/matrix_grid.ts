import { MatrixGrid, map_grid } from "@/Core/grid";
import { Image } from "ProcedualArt/image";
import { render_vec3_grid } from "./vec3_grid";
import { GridRenderDimensionsArgs } from "./with_callback";

export function render_matrix_grid(
    g: MatrixGrid,
    img_dimensions: GridRenderDimensionsArgs = null,
): Image {
    return render_vec3_grid(
        map_grid("vec3", g, (m) => [
            m.det(),
            Math.max(...m.eigenvalues().map((v) => Math.abs(v))),
            m.abs().max(),
        ]),
        img_dimensions,
    );
}
