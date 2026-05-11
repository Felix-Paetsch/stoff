import { Vector } from "Core/geometry/index";
import {
    wasm_graph_minimum_spanning_tree,
    wasm_graph_minimum_spanning_tree_of_vertices,
    WASMCompatability,
} from "Rust/exports";
import { Graph } from "../graph";
import { into_length_graph, IntoLengthGraph } from "../graph_conversion";
import { VertexGraph } from "../types";

export function minimum_spanning_tree<E extends IntoLengthGraph>(on: E): E {
    const lg = into_length_graph(on);

    const ser = WASMCompatability.Graph.graph_to_transmittable_graph(lg);
    const edge_subset = wasm_graph_minimum_spanning_tree(ser);

    return WASMCompatability.Graph.reconstruct_subgraph(
        on,
        edge_subset,
        "copy",
    );
}

export function minimum_spanning_tree_on_vertices(on: Vector[]): VertexGraph {
    const arr = WASMCompatability.Geometry.vertex_vec_to_vecf64(on);
    // [edgep1, edgep2, edgep1, edgep2, ...]
    const edges = wasm_graph_minimum_spanning_tree_of_vertices(arr);
    const res = new Graph(on, []);
    for (let i = 0; i < edges.length; i += 2) {
        res.add_edge(edges[i]!, edges[i + 1]!);
    }

    return res;
}
