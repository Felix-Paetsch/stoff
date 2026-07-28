import { Polygon, Polyline, Shape, Vector } from "@/Core/geometry";
import { Json } from "@/Core/utils";
import { Graph, LengthGraph, ShapeGraph, VertexGraph } from "@/ProcArt/graph";
import { destringify_f64_array, stringify_f64_array } from "./number_array";

export function serialize_length_graph(g: LengthGraph): {
    type: "length_graph";
    data: Json;
} {
    return {
        type: "length_graph",
        data: {
            edge_end_indices: g.edges.flatMap((e) => e.end_indices),
            edge_values: g.edges.flatMap((e) => e.data),
            node_count: g.nodes.length
        }
    };
}

export function serialize_vertex_graph(g: VertexGraph): {
    type: "vertex_graph";
    data: Json;
} {
    return {
        type: "vertex_graph",
        data: {
            edge_end_indices: g.edges.flatMap((e) => e.end_indices),
            nodes: g.nodes.flatMap((n) => [n.data.x, n.data.y])
        }
    };
}

export function serialize_shape_graph(g: ShapeGraph): {
    type: "shape_graph";
    data: Json;
} {
    return {
        type: "shape_graph",
        data: {
            edge_end_indices: g.edges.flatMap((e) => e.end_indices),
            nodes: g.nodes.flatMap((n) => [n.data.x, n.data.y]),
            edges: g.edges.map((e) => ({
                is_polyline: e.data.is_polyline(),
                vertices: stringify_f64_array(
                    e.data.vertices.flatMap((v) => [v.x, v.y])
                )
            }))
        }
    };
}

export function deserialize_length_graph(value: {
    type: "length_graph";
    data: any;
}): LengthGraph {
    const { edge_end_indices, edge_values, node_count } = value.data;
    const edges: {
        end_indices: [number, number];
        data: number;
    }[] = [];

    for (let i = 0; i < edge_values.length; i++) {
        edges.push({
            end_indices: [
                edge_end_indices[2 * i]!,
                edge_end_indices[2 * i + 1]!
            ],
            data: edge_values[i]!
        });
    }

    return new Graph(
        Array.from({ length: node_count }, () => undefined),
        edges
    );
}

export function deserialize_vertex_graph(value: {
    type: "vertex_graph";
    data: any;
}): VertexGraph {
    const { edge_end_indices, nodes } = value.data;
    const vertices: Vector[] = [];

    for (let i = 0; i < nodes.length; i += 2) {
        vertices.push(new Vector(nodes[i]!, nodes[i + 1]!));
    }

    const edges: [number, number][] = [];

    for (let i = 0; i < edge_end_indices.length; i += 2) {
        edges.push([edge_end_indices[i]!, edge_end_indices[i + 1]!]);
    }

    return new Graph(vertices, edges);
}

export function deserialize_shape_graph(value: {
    type: "shape_graph";
    data: any;
}): ShapeGraph {
    const { edge_end_indices, nodes, edges: serializedEdges } = value.data;

    const vertices: Vector[] = [];
    for (let i = 0; i < nodes.length; i += 2) {
        vertices.push(new Vector(nodes[i]!, nodes[i + 1]!));
    }

    const edges: {
        end_indices: [number, number];
        data: Shape.Shape;
    }[] = [];

    for (let i = 0; i < serializedEdges.length; i++) {
        const serializedEdge = serializedEdges[i];
        const values = destringify_f64_array(serializedEdge.vertices);
        const shapeVertices: Vector[] = [];

        for (let j = 0; j < values.length; j += 2) {
            shapeVertices.push(new Vector(values[j]!, values[j + 1]!));
        }

        const shape = serializedEdge.is_polyline
            ? new Polyline(shapeVertices)
            : new Polygon(shapeVertices);

        edges.push({
            end_indices: [
                edge_end_indices[2 * i]!,
                edge_end_indices[2 * i + 1]!
            ],
            data: shape
        });
    }

    return new Graph(vertices, edges);
}
