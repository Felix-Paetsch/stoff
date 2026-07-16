import { Graph } from "@/Core/graph";
import { WASMUsizeUsizeGraph } from "Rust/exports";

export function usize_usize_graph_from_wasm(
    g: WASMUsizeUsizeGraph,
): Graph<number, number> {
    const nodes = Array.from(g.nodes());
    const node_count = nodes.length;
    const edges_weights = g.edges();
    const edges_node_indices = g.edge_endpoint_indices();

    const edges = Array.from(edges_weights).map((v, i) => {
        const edge_node_idx = edges_node_indices[i]!;
        const a = edge_node_idx % node_count;
        const b = edge_node_idx - a * node_count;

        return {
            end_indices: [a, b] as [number, number],
            data: v,
        };
    });

    return new Graph(nodes, edges);
}
