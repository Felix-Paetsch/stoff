from __future__ import annotations

from typing import Any, Literal, TypedDict

from ..types.graph import Graph
from .index import LengthGraph, Polygon, Polyline, ShapeGraph, Vector, VertexGraph
from .number_array import destringify_f64_array, stringify_f64_array


class SerializedLengthGraph(TypedDict):
    type: Literal["length_graph"]
    data: Any


class SerializedVertexGraph(TypedDict):
    type: Literal["vertex_graph"]
    data: Any


class SerializedShapeGraph(TypedDict):
    type: Literal["shape_graph"]
    data: Any


def serialize_length_graph(g: LengthGraph) -> SerializedLengthGraph:
    edge_end_indices: list[int] = []
    edge_values: list[float] = []

    for edge_data, start_index, end_index in g.edges:
        edge_end_indices.extend([start_index, end_index])
        edge_values.append(edge_data)

    return {
        "type": "length_graph",
        "data": {
            "edge_end_indices": edge_end_indices,
            "edge_values": edge_values,
            "node_count": len(g.nodes),
        },
    }


def serialize_vertex_graph(g: VertexGraph) -> SerializedVertexGraph:
    edge_end_indices: list[int] = []
    nodes: list[float] = []

    for node in g.nodes:
        nodes.extend([node.x, node.y])

    for _, start_index, end_index in g.edges:
        edge_end_indices.extend([start_index, end_index])

    return {
        "type": "vertex_graph",
        "data": {
            "edge_end_indices": edge_end_indices,
            "nodes": nodes,
        },
    }


def serialize_shape_graph(g: ShapeGraph) -> SerializedShapeGraph:
    edge_end_indices: list[int] = []
    nodes: list[float] = []
    serialized_edges: list[dict[str, Any]] = []

    for node in g.nodes:
        nodes.extend([node.x, node.y])

    for shape, start_index, end_index in g.edges:
        edge_end_indices.extend([start_index, end_index])

        serialized_edges.append(
            {
                "is_polyline": isinstance(shape, Polyline),
                "vertices": stringify_f64_array(shape.points),
            }
        )

    return {
        "type": "shape_graph",
        "data": {
            "edge_end_indices": edge_end_indices,
            "nodes": nodes,
            "edges": serialized_edges,
        },
    }


def deserialize_length_graph(
    value: SerializedLengthGraph,
) -> LengthGraph:
    data = value["data"]

    edge_end_indices = data["edge_end_indices"]
    edge_values = data["edge_values"]
    node_count = data["node_count"]

    edges: list[tuple[float, int, int]] = []

    for i, edge_value in enumerate(edge_values):
        start_index = edge_end_indices[2 * i]
        end_index = edge_end_indices[2 * i + 1]

        edges.append((edge_value, start_index, end_index))

    nodes: list[None] = [None] * node_count

    return Graph(nodes=nodes, edges=edges, type="length_graph")


def deserialize_vertex_graph(
    value: SerializedVertexGraph,
) -> VertexGraph:
    data = value["data"]

    serialized_nodes = data["nodes"]
    edge_end_indices = data["edge_end_indices"]

    vertices: list[Vector] = []

    for i in range(0, len(serialized_nodes), 2):
        vertices.append(
            Vector(
                serialized_nodes[i],
                serialized_nodes[i + 1],
            )
        )

    edges: list[tuple[None, int, int]] = []

    for i in range(0, len(edge_end_indices), 2):
        edges.append(
            (
                None,
                edge_end_indices[i],
                edge_end_indices[i + 1],
            )
        )

    return Graph(nodes=vertices, edges=edges, type="vertex_graph")


def deserialize_shape_graph(
    value: SerializedShapeGraph,
) -> ShapeGraph:
    data = value["data"]

    serialized_nodes = data["nodes"]
    edge_end_indices = data["edge_end_indices"]
    serialized_edges = data["edges"]

    vertices: list[Vector] = []

    for i in range(0, len(serialized_nodes), 2):
        vertices.append(
            Vector(
                serialized_nodes[i],
                serialized_nodes[i + 1],
            )
        )

    edges: list[tuple[Polyline | Polygon, int, int]] = []

    for i, serialized_edge in enumerate(serialized_edges):
        shape_positions = destringify_f64_array(serialized_edge["vertices"])

        if serialized_edge["is_polyline"]:
            shape: Polyline | Polygon = Polyline(shape_positions)
        else:
            shape = Polygon(shape_positions)

        start_index = edge_end_indices[2 * i]
        end_index = edge_end_indices[2 * i + 1]

        edges.append((shape, start_index, end_index))

    return Graph(nodes=vertices, edges=edges, type="shape_graph")
