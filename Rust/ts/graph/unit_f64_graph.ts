import { LengthGraph } from "ProcedualArt/primitives/graph/types";
import { WASMUnitFloat64Graph } from "Rust/exports";
import { Allocations } from "../index";

export function wasm_unit_f64_graph(g: LengthGraph): WASMUnitFloat64Graph {
    const nodes = g.nodes.length;
    return Allocations.allocate(
        WASMUnitFloat64Graph.new(
            nodes,
            new Uint32Array(
                g.edges.map((e) => e.end_indices[0] * nodes + e.end_indices[1]),
            ),
            new Float64Array(g.edges.map((e) => e.data)),
        ),
    );
}
