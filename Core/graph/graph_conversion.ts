import { Polyline, Vector } from "Core/geometry/index";
import { CollectionMethods, Line, Point, Sketch } from "Core/sketch/index";
import { SketchElementCollection } from "Core/sketch/types";
import { Graph } from "./graph";
import {
    internal_is_shape_graph,
    internal_is_vertex_graph,
    LengthGraph,
    ShapeGraph,
    VertexGraph,
} from "./types";

export type IntoLengthGraph = Graph<any, number> | VertexGraph | ShapeGraph;
export function into_length_graph(g: IntoLengthGraph): LengthGraph {
    if (g.edges.length == 0) {
        return new Graph(new Array(g.nodes.length).fill(undefined), []);
    }

    if (typeof g.edges[0] == "number") {
        return forget_vertices(g as Graph<any, number>);
    }

    const as_internal: VertexGraph | ShapeGraph = g as any;
    if (internal_is_vertex_graph(as_internal)) {
        return as_internal.map(
            () => undefined,
            (_, e) => {
                return as_internal
                    .node_data(e.end_indices[0])
                    .distance(as_internal.node_data(e.end_indices[1]));
            },
        );
    }

    return as_internal.map(
        () => undefined,
        (e) => e.length(),
    );
}

export type IntoVertexGraph = Graph<Vector, any>;
export function into_vertex_graph(g: IntoVertexGraph): VertexGraph {
    return forget_edges(g);
}

export type IntoShapeGraph = ShapeGraph | VertexGraph;
export function into_shape_graph(g: IntoShapeGraph): ShapeGraph {
    if (internal_is_shape_graph(g)) return g;
    const edges = g.edges.map((e) => ({
        ...e,
        data: new Polyline(g.endpoints(e).map((p) => p.data)),
    }));
    return new Graph(
        g.nodes.map((n) => n.data),
        edges,
    );
}

export function forget_edges<N, E>(g: Graph<N, E>): Graph<N> {
    return new Graph(
        g.nodes.map((n) => n.data),
        g.edges.map((e) => e.end_indices),
    );
}

export function forget_vertices<N, E>(g: Graph<N, E>): Graph<undefined, E> {
    return new Graph(new Array(g.nodes.length).fill(undefined), [
        ...g.edges,
    ] as any[]);
}

export function copy<N, E>(g: Graph<N, E>): Graph<N, E> {
    return new Graph(
        g.nodes.map((n) => n.data),
        g.edges as {
            end_indices: [number, number];
            data: E;
        }[] as any,
    );
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

export function to_sketch(g: ShapeGraph | VertexGraph) {
    if (!internal_is_shape_graph(g)) {
        g = into_shape_graph(g);
    }

    const sketch = new Sketch();
    const pts = g.nodes.map((n) => sketch.add_point(n.data));
    g.edges.map((e) =>
        sketch.add_line(e.data, pts[e.end_indices[0]]!, pts[e.end_indices[1]]!),
    );
    return sketch;
}
