import { Vector } from "@/Core/geometry";

import {
    wasm_graph_min_spanning_tree_edge_list,
    wasm_graph_min_spanning_tree_of_vertices_edge_list,
    WASMCompatability,
} from "Rust/exports";
import { Graph } from "../graph";
import { into_length_graph, IntoLengthGraph } from "../graph_conversion";
import { VertexGraph } from "../types";

export function minimum_spanning_tree<E extends IntoLengthGraph>(on: E): E {
    const lg = into_length_graph(on);

    const ser = WASMCompatability.Graph.wasm_unit_f64_graph(lg);
    const edges = WASMCompatability.Allocations.free_after_use(ser, (ser) =>
        wasm_graph_min_spanning_tree_edge_list(ser),
    );

    return WASMCompatability.Graph.reconstruct_subgraph(
        on,
        "all_nodes",
        Array.from(edges),
        "copy",
    );
}

export function minimum_spanning_tree_on_vertices(on: Vector[]): VertexGraph {
    const arr = WASMCompatability.Geometry.wasm_vector_vec(on);
    // [edgep1, edgep2, edgep1, edgep2, ...]
    const edges = wasm_graph_min_spanning_tree_of_vertices_edge_list(arr);
    const res = new Graph(on, []);
    for (let i = 0; i < edges.length; i += 2) {
        res.add_edge(edges[i]!, edges[i + 1]!);
    }

    return res;
}
