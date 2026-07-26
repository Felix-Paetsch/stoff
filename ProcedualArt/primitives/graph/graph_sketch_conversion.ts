import {
    CollectionMethods,
    Line,
    Point,
    Sketch,
    SketchElementCollection,
} from "Core/sketch/index";
import { Graph } from "./graph";
import { into_shape_graph } from "./graph_conversion";
import { ShapeGraph, VertexGraph } from "./types";

export function sketch_to_shape_graph(s: Sketch) {
    return sketch_element_collection_to_shape_graph(s);
}

export function sketch_element_collection_to_shape_graph(
    c: SketchElementCollection,
    endpoint_line_policy:
        | "endpoint_hull"
        | "endpoint_interior" = "endpoint_hull",
): ShapeGraph {
    const modified_sec_method =
        endpoint_line_policy == "endpoint_hull"
            ? CollectionMethods.endpoint_hull
            : CollectionMethods.endpoint_interior;

    const modified_sec = modified_sec_method(c);
    const pts = modified_sec.filter((e) => e instanceof Point);
    const lns = modified_sec.filter((e) => e instanceof Line);

    return new Graph(
        pts.map((p) => p.vec),
        lns.map(
            (l) =>
                ({
                    end_indices: [
                        pts.findIndex((p) => p == l.p1)!,
                        pts.findIndex((p) => p == l.p2)!,
                    ],
                    data: l.shape,
                }) as any,
        ),
    );
}

export function shape_graph_to_sketch(g: ShapeGraph) {
    const sketch = new Sketch();
    const pts = g.nodes.map((n) => sketch.add_point(n.data));
    g.edges.map((e) =>
        sketch.add_line(e.data, pts[e.end_indices[0]]!, pts[e.end_indices[1]]!),
    );
    return sketch;
}

export function vertex_graph_to_sketch(g: VertexGraph) {
    const h = into_shape_graph(g);
    return shape_graph_to_sketch(h);
}
