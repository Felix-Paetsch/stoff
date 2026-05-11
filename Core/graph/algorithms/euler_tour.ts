import { Graph } from "../graph";

export function euler_tour<E extends Graph<any, any>>(
    g: E,
): null | Graph.Edge<Graph.ExtractEdgeType<E>>[] {
    if (g.is_empty()) return [];

    const degrees = new Array(g.nodes.length).fill(0);

    for (const e of g.edges) {
        degrees[e.end_indices[0]]!++;
        degrees[e.end_indices[1]]!++;
    }

    const oddVertices = degrees
        .map((degree, index) => (degree % 2 === 1 ? index : -1))
        .filter((index) => index !== -1);

    if (oddVertices.length !== 0 && oddVertices.length !== 2) {
        return null;
    }

    const startVertex =
        oddVertices.length === 2
            ? oddVertices[0]!
            : degrees.findIndex((d) => d > 0);

    if (startVertex === -1) {
        return [];
    }

    if (!is_connected_ignoring_isolated_vertices(g, degrees, startVertex)) {
        return null;
    }

    const used = new Array(g.edges.length).fill(false);
    const nextEdgeIndex = new Array(g.nodes.length).fill(0);

    const vertexStack: number[] = [startVertex];
    const edgeStack: (typeof g.Edge)[] = [];
    const tour: (typeof g.Edge)[] = [];

    while (vertexStack.length > 0) {
        const v = vertexStack[vertexStack.length - 1]!;
        const incident = g.edges_at(v);

        let foundEdge: typeof g.Edge | null = null;

        while (nextEdgeIndex[v]! < incident.length) {
            const e = incident[nextEdgeIndex[v]!]!;
            nextEdgeIndex[v]!++;

            if (used[e.index]) continue;

            foundEdge = e;
            break;
        }

        if (foundEdge) {
            used[foundEdge.index] = true;
            const u = g.other_node(foundEdge, v).index;
            vertexStack.push(u);
            edgeStack.push(foundEdge);
        } else {
            vertexStack.pop();

            if (edgeStack.length > 0) {
                tour.push(edgeStack.pop()!);
            }
        }
    }

    if (tour.length !== g.edges.length) {
        return null;
    }

    tour.reverse();
    return tour;
}

function is_connected_ignoring_isolated_vertices<N, E>(
    g: Graph<N, E>,
    degrees: number[],
    start: number,
): boolean {
    const visited = new Array(g.nodes.length).fill(false);
    const stack = [start];
    visited[start] = true;

    while (stack.length > 0) {
        const v = stack.pop()!;

        for (const e of g.edges_at(v)) {
            const u = g.other_node(e, v).index;
            if (!visited[u]) {
                visited[u] = true;
                stack.push(u);
            }
        }
    }

    for (let i = 0; i < g.nodes.length; i++) {
        if (degrees[i]! > 0 && !visited[i]) {
            return false;
        }
    }

    return true;
}
