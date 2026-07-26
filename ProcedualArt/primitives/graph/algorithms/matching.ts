import {
    wasm_graph_max_weight_perfect_matching,
    wasm_graph_min_weight_perfect_matching,
    WASMCompatability,
} from "Rust/exports";
import { into_length_graph, IntoLengthGraph } from "../graph_conversion";

export function min_weight_perfect_matching(
    g: IntoLengthGraph,
): [number, number][] {
    const r = WASMCompatability.Allocations.free_after_use(
        WASMCompatability.Graph.wasm_unit_f64_graph(into_length_graph(g)),
        (g) => wasm_graph_min_weight_perfect_matching(g),
    );

    const edges: [number, number][] = [];

    for (let i = 0; i < r.length; i += 2) {
        edges.push([r[i]!, r[i + 1]!]);
    }

    return edges;
}

export function max_weight_perfect_matching(
    g: IntoLengthGraph,
): [number, number][] {
    const r = WASMCompatability.Allocations.free_after_use(
        WASMCompatability.Graph.wasm_unit_f64_graph(into_length_graph(g)),
        (g) => wasm_graph_max_weight_perfect_matching(g),
    );

    const edges: [number, number][] = [];

    for (let i = 0; i < r.length; i += 2) {
        edges.push([r[i]!, r[i + 1]!]);
    }

    return edges;
}
