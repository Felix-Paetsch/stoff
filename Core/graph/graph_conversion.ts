import { Polyline, Vector } from "@/Core/geometry";

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
