import { LinearTransform, Polyline, Shape, Vector } from "@/Core/geometry";
import { EPS } from "@/Core/numerics";
import {
    internal_is_vertex_graph,
    ShapeGraph,
    VertexGraph,
} from "ProcedualArt/primitives/graph";

export function double_run_graph<G extends VertexGraph | ShapeGraph>(
    graph: G,
    starting_at_node: number = 0,
): Polyline {
    if (
        graph.is_empty() ||
        starting_at_node < 0 ||
        starting_at_node >= graph.nodes.length
    ) {
        return Polyline.empty();
    }

    const path: Vector[] = [];
    const visited_edges = new Set<number>();

    path.push(graph.nodes[starting_at_node]!.data);

    if (internal_is_vertex_graph(graph)) {
        traverse_vertex_graph(graph, starting_at_node, visited_edges, path);
    } else {
        traverse_shape_graph(graph, starting_at_node, visited_edges, path);
    }

    return new Polyline(path);
}

function traverse_vertex_graph(
    graph: VertexGraph,
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
    graph: ShapeGraph,
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
        const from = graph.nodes[at]!.data;
        const to = next.data;

        const adjusted_shape = get_adjusted_shape(edge.data, from, to);

        // The shape includes both endpoints. Skip the first endpoint because
        // it is already the current last point in the path.
        path.push(...adjusted_shape.slice(1));

        traverse_shape_graph(graph, next.index, visited_edges, path);

        // Traverse the shape in reverse to return from `to` to `from`.
        // Skip the first reversed point because it is already the current
        // last point in the path.
        path.push(...[...adjusted_shape].reverse().slice(1));
    }
}

function get_adjusted_shape(
    shape: Shape.Shape,
    from: Vector,
    to: Vector,
): Vector[] {
    if (shape.is_empty()) {
        return [from, to];
    }

    const polyline = shape.as_polyline();
    const vertices = [...polyline.vertices];

    const first = polyline.first()!;
    const last = polyline.last()!;

    if (first.approx_equals(from) && last.approx_equals(to)) {
        return vertices;
    }

    if (first.approx_equals(to) && last.approx_equals(from)) {
        return vertices.reverse();
    }

    if (first.distance_squared(last) < EPS.tiny) {
        if (!from.approx_equals(to)) {
            throw new Error("Shape is closed while points are distant.");
        }

        return vertices;
    }

    const transform = LinearTransform.affine_orthogonal(
        [first, last],
        [from, to],
    );

    return vertices.map((vertex) => transform(vertex));
}
