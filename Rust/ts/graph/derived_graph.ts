import { Graph } from "Core/graph/graph";
import { graph_to_transmittable_graph } from "./transmittable_graph";
import {
    EdgeMappingFunction,
    NodeMappingFunction,
    TransmittableGraph,
} from "./types";

export function derive_transmittable_graph<N, E>(
    g: Graph<N, E>,
    map_node: NodeMappingFunction<N>,
    map_edge: EdgeMappingFunction<E>,
) {
    const new_g = new Graph(
        g.nodes.map((n) => map_node(n.data, n)),
        g.edges.map((e) => ({
            data: map_edge(e.data, e),
            end_indices: e.end_indices,
        })),
    );

    return graph_to_transmittable_graph(new_g as TransmittableGraph);
}
