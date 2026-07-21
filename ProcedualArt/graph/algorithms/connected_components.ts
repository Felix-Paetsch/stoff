import { Graph } from "../graph";

export function connected_component_indices<E extends Graph<any, any>>(
    g: E,
): number[][] {
    const n = g.nodes.length;
    const visited = new Array(n).fill(false);
    const components: number[][] = [];

    for (let start = 0; start < n; start++) {
        if (visited[start]) continue;

        const component: number[] = [];
        const stack = [start];
        visited[start] = true;

        while (stack.length > 0) {
            const v = stack.pop()!;
            component.push(v);

            for (const edge of g.edges_at(v)) {
                const u = g.other_node(edge, v).index;
                if (!visited[u]) {
                    visited[u] = true;
                    stack.push(u);
                }
            }
        }

        components.push(component);
    }

    return components;
}

export function connected_components<E extends Graph<any, any>>(g: E): E[] {
    const components = connected_component_indices(g);

    return components.map((indices) => {
        const nodeSet = new Set(indices);

        const nodes = indices.map((i) => g.node_data(i));

        const edges = g.edges
            .filter(
                (e) =>
                    nodeSet.has(e.end_indices[0]) &&
                    nodeSet.has(e.end_indices[1]),
            )
            .map((e) => ({
                end_indices: e.end_indices,
                data: e.data,
            }));

        return new Graph(nodes, edges as any) as E;
    });
}
