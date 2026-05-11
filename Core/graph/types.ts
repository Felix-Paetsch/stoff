import { Shape } from "Core/geometry/index";
import { Vector } from "Core/geometry/vector";
import { Graph } from "./graph";

export type VertexGraph = Graph<Vector>;
export type LengthGraph = Graph<undefined, number>;
export type ShapeGraph = Graph<Vector, Shape.Shape>;

export type InternalGraphType = LengthGraph | VertexGraph | ShapeGraph;

export function internal_is_length_graph(
    g: InternalGraphType,
): g is LengthGraph {
    return g.edges.length == 0 || typeof g.edges[0]!.data == "number";
}

export function internal_is_vertex_graph(
    g: InternalGraphType,
): g is VertexGraph {
    if (g.nodes.length == 0) return true;
    return g.nodes[0]!.data instanceof Vector;
}

export function internal_is_shape_graph(g: InternalGraphType): g is ShapeGraph {
    if (g.nodes.length == 0) return true;
    if (!(g.nodes[0]!.data instanceof Vector)) return false;
    return g.edges.length == 0 || g.edges[0]!.data instanceof Shape;
}

export function is_length_graph(g: Graph<any, any>): g is LengthGraph {
    return (
        g.edges.every((e) => typeof e.data == "number") &&
        g.nodes.every((n) => n.data === undefined)
    );
}

export function is_vertex_graph(g: Graph<any, any>): g is VertexGraph {
    return (
        g.nodes.every((n) => n.data instanceof Vector) &&
        g.edges.every((n) => n.data === undefined)
    );
}

export function is_shape_graph(g: Graph<any, any>): g is ShapeGraph {
    if (g.nodes.some((n) => !(n.data instanceof Vector))) return false;
    return g.edges.every((e) => e.data instanceof Shape);
}
