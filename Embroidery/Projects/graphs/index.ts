import { Vector } from "@/Core/geometry";
import { minimum_spanning_tree_on_vertices } from "@/Core/graph";
import { defineEmbroidery } from "Embroidery/types";

export const GraphsProject = defineEmbroidery("Graphs" as const, (_cfg: {}) => {
    const pts = [
        Vector.ZERO,
        Vector.UP,
        Vector.DOWN,
        Vector.LEFT,
        Vector.RIGHT,
        Vector.RIGHT.scale(2),
    ];

    // Todo: import Graph from Embroidery
    // Double Run (stating at: 0) = Polygon

    console.log(pts);
    const mst = minimum_spanning_tree_on_vertices(pts);
    console.log(mst);
});
