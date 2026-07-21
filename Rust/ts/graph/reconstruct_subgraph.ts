import { Expect } from "@/Core/expect";
import { Graph } from "ProcedualArt/graph";

export function reconstruct_subgraph<T extends Graph<any, any>>(
    on: T,
    nodes: "all_nodes" | number[],
    edges: number[],
    inplace: "inplace" | "copy" = "inplace",
): T {
    const selectedNodeIndices =
        nodes === "all_nodes" ? on.nodes.map((_, index) => index) : nodes;

    Expect.that(() => {
        for (const nodeIndex of selectedNodeIndices) {
            if (
                !Number.isInteger(nodeIndex) ||
                nodeIndex < 0 ||
                nodeIndex >= on.nodes.length
            ) {
                return false;
            }
        }

        for (let i = 0; i < selectedNodeIndices.length; i++) {
            for (let j = i + 1; j < selectedNodeIndices.length; j++) {
                if (selectedNodeIndices[i] === selectedNodeIndices[j]) {
                    return false;
                }
            }
        }

        for (const edgeIndex of edges) {
            if (
                !Number.isInteger(edgeIndex) ||
                edgeIndex < 0 ||
                edgeIndex >= on.edges.length
            ) {
                return false;
            }
        }

        for (let i = 0; i < edges.length; i++) {
            for (let j = i + 1; j < edges.length; j++) {
                if (edges[i] === edges[j]) return false;
            }
        }

        return true;
    });

    const nodeSet = new Set(selectedNodeIndices);

    const selectedEdges = edges
        .map((edgeIndex) => on.edges[edgeIndex]!)
        .filter((edge) => {
            const [from, to] = edge.end_indices;
            return nodeSet.has(from) && nodeSet.has(to);
        });

    const nodeIndexMap = new Map<number, number>();

    const selectedNodes = selectedNodeIndices.map((oldIndex, newIndex) => {
        nodeIndexMap.set(oldIndex, newIndex);
        return on.nodes[oldIndex]!.data;
    });

    const reconstructedEdges = selectedEdges.map((edge) => ({
        end_indices: [
            nodeIndexMap.get(edge.end_indices[0])!,
            nodeIndexMap.get(edge.end_indices[1])!,
        ] as [number, number],
        data: edge.data,
    }));

    if (inplace === "copy") {
        return new Graph(selectedNodes, reconstructedEdges) as T;
    }

    on.nodes = selectedNodes.map((data, index) => ({
        data,
        index,
    })) as typeof on.nodes;

    on.edges = reconstructedEdges.map((edge, index) => ({
        ...edge,
        index,
    })) as typeof on.edges;

    return on;
}
