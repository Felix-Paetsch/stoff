import { EPS, Polygon } from "@/Core";
import {
    wasm_graph_double_run_graph,
    wasm_graph_identify_equal_nodes,
} from "Rust/exports";
import { Graph } from "./graph";

export function double_run(what: Graph, starting_at: number = 0): Polygon {
    if (what.vertices.length == 0) return Polygon.empty();
    if (starting_at > what.vertices.length) {
        starting_at = 0;
    }

    const graph = what.to_wasm_vecf64();
    const gon_array = wasm_graph_double_run_graph(graph, starting_at)!;
    return Polygon.from_wasm_vecf64(gon_array);
}

export function identify_equal_vertices(
    graph: Graph,
    tolerance: number = EPS.tiny,
): Graph {
    const encoded = graph.to_wasm_vecf64();
    const res = wasm_graph_identify_equal_nodes(encoded, tolerance);
    return Graph.from_wasm_vecf64(res!);
}
