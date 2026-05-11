import { EPS, Graph, LinearTransform, Polyline, Shape } from "@/Core";
import { Vector } from "Core/geometry/vector";

export function double_run_graph<
    G extends Graph.VertexGraph | Graph.ShapeGraph,
>(graph: G, starting_at_node: number = 0): Polyline {
    if (graph.is_empty() || starting_at_node >= graph.nodes.length) {
        return Polyline.empty();
    }

    const path: Vector[] = [];
    const visited_edges = new Set<number>();

    path.push(graph.nodes[starting_at_node]!.data);
    if (Graph.internal_is_vertex_graph(graph)) {
        traverse_vertex_graph(graph, starting_at_node, visited_edges, path);
    } else {
        traverse_shape_graph(graph, starting_at_node, visited_edges, path);
    }

    return new Polyline(path);
}

function traverse_vertex_graph(
    graph: Graph.VertexGraph,
    at: number,
    visited_edges: Set<number>,
    path: Vector[],
): void {
    for (const edge of graph.edges_at(at)) {
        if (visited_edges.has(edge.index)) {
            continue;
        }

        visited_edges.add(edge.index);

        const next = graph.other_node(edge as any, at);

        path.push(next.data);
        traverse_vertex_graph(graph, next.index, visited_edges, path);
        path.push(graph.nodes[at]!.data);
    }
}

function traverse_shape_graph(
    graph: Graph.ShapeGraph,
    at: number,
    visited_edges: Set<number>,
    path: Vector[],
): void {
    for (const edge of graph.edges_at(at)) {
        if (visited_edges.has(edge.index)) {
            continue;
        }

        visited_edges.add(edge.index);
        const next = graph.other_node(edge as any, at);

        const adjusted_shape = get_adjusted_shape(
            edge.data,
            graph.nodes[at]!.data,
            next.data,
        );

        path.push(...adjusted_shape);
        path.push(next.data);
        traverse_shape_graph(graph, next.index, visited_edges, path);
        path.push(...adjusted_shape.reverse());
        path.push(next.data);
    }
}

function get_adjusted_shape(
    s: Shape.Shape,
    from: Vector,
    to: Vector,
): Vector[] {
    if (s.is_empty()) return [];
    const as_pl = s.as_polyline();
    const verts = [...as_pl.vertices];

    if (as_pl.first()!.equals(from) && as_pl.last()!.equals(to)) {
        return verts;
    }

    if (as_pl.first()!.distance_squared(as_pl.last()!) < EPS.tiny) {
        if (from.equals(to))
            throw new Error("Shape is closed while points are distant.");
        return verts;
    }

    const trafo = LinearTransform.affine_orthogonal(
        [as_pl.first()!, as_pl.last()!],
        [from, to],
    );

    return verts.map((v) => trafo(v));
}
