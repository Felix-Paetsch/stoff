import { EPS, Polygon } from "@/Core";
import {
    double_run_graph,
    f64_to_undirected_graph,
    f64_to_vec_array,
    identify_equal_nodes,
    undirected_graph_to_f64_array,
} from "../rust/exports";
import { Graph } from "./graph";

export function double_run(what: Graph, starting_at: number = 0): Polygon {
    if (what.vertices.length == 0) return Polygon.empty();
    if (starting_at > what.vertices.length) {
        starting_at = 0;
    }

    const graph = undirected_graph_to_f64_array(what);
    const gon_array = double_run_graph(graph, starting_at)!;
    const gon_vert = f64_to_vec_array(gon_array);

    return new Polygon(gon_vert);
}

export function identify_equal_verticies(
    graph: Graph,
    tolerance: number = EPS.tiny,
): Graph {
    const encoded = undirected_graph_to_f64_array(graph);
    const gon_array = identify_equal_nodes(encoded, tolerance)!;
    return f64_to_undirected_graph(gon_array);
}
