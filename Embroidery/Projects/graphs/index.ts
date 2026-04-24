import { Vector } from "@/Core";
import { Graph } from "Embroidery/Lib/index";
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
    const mst = Graph.minimum_spanning_tree(pts);
    console.log(mst);
});
