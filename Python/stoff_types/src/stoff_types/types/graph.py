from __future__ import annotations

from dataclasses import dataclass
from typing import Generic, TypeAlias, TypeVar

NodeType = TypeVar("NodeType")
EdgeType = TypeVar("EdgeType")

Edge: TypeAlias = tuple[EdgeType, int, int]


@dataclass
class Graph(Generic[NodeType, EdgeType]):
    nodes: list[NodeType]
    edges: list[Edge[EdgeType]]

    def add_node(self, node_data: NodeType) -> int:
        self.nodes.append(node_data)
        return len(self.nodes) - 1

    def remove_node(self, index: int) -> NodeType:
        node_data = self.nodes.pop(index)

        updated_edges: list[Edge[EdgeType]] = []

        for edge_data, start_index, end_index in self.edges:
            if start_index == index or end_index == index:
                continue

            updated_start_index = (
                start_index - 1 if start_index > index else start_index
            )
            updated_end_index = end_index - 1 if end_index > index else end_index

            updated_edges.append((edge_data, updated_start_index, updated_end_index))

        self.edges = updated_edges
        return node_data

    def add_edge(
        self,
        data: EdgeType,
        n1_index: int,
        n2_index: int,
    ) -> int:
        if not 0 <= n1_index < len(self.nodes):
            raise IndexError(f"Node index out of range: {n1_index}")

        if not 0 <= n2_index < len(self.nodes):
            raise IndexError(f"Node index out of range: {n2_index}")

        self.edges.append((data, n1_index, n2_index))
        return len(self.edges) - 1

    def remove_edge(self, index: int) -> EdgeType:
        data, _, _ = self.edges.pop(index)
        return data
