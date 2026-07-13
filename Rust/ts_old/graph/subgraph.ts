import { Graph } from "Core/graph/graph";

export function reconstruct_subgraph<E extends Graph<any, any>>(
    g: E,
    from: Uint32Array,
    where: "in_place" | "copy" = "in_place",
): E {
    if (from.length === 0) {
        throw new Error("Invalid subgraph encoding: empty array");
    }

    const kind = from[0];

    switch (kind) {
        case 0: {
            // Node subset:
            // [0, ...nodeIds]
            const nodeMask = build_mask(from, 1);
            return where === "in_place"
                ? reconstruct_nodes_in_place(g, nodeMask)
                : reconstruct_nodes_copy(g, nodeMask);
        }

        case 1: {
            // Edge subset:
            // [1, ...edgeIds]
            const edgeMask = build_mask(from, 1);
            return where === "in_place"
                ? reconstruct_edges_in_place(g, edgeMask)
                : reconstruct_edges_copy(g, edgeMask);
        }

        case 2: {
            // Explicit subgraph:
            // [2, nodeCount, ...nodeIds, ...edgeIds]
            if (from.length < 2) {
                throw new Error(
                    "Invalid subgraph encoding: missing node count",
                );
            }

            const nodeCount = from[1]!;
            const nodeStart = 2;
            const nodeEnd = nodeStart + nodeCount;

            if (nodeEnd > from.length) {
                throw new Error(
                    "Invalid subgraph encoding: node count exceeds array length",
                );
            }

            const nodeMask = build_mask(from.subarray(nodeStart, nodeEnd));
            const edgeMask = build_mask(from.subarray(nodeEnd));

            return where === "in_place"
                ? reconstruct_subgraph_in_place(g, nodeMask, edgeMask)
                : reconstruct_subgraph_copy(g, nodeMask, edgeMask);
        }

        default:
            throw new Error(`Invalid subgraph encoding: unknown kind ${kind}`);
    }
}

function build_mask(ids: Uint32Array, start = 0): Uint8Array {
    let max = -1;

    for (let i = start; i < ids.length; i++) {
        const id = ids[i]!;
        if (id > max) max = id;
    }

    if (max < 0) {
        return new Uint8Array(0);
    }

    const mask = new Uint8Array(max + 1);
    for (let i = start; i < ids.length; i++) {
        mask[ids[i]!] = 1;
    }

    return mask;
}

function has(mask: Uint8Array, id: number): boolean {
    return id >= 0 && id < mask.length && mask[id] === 1;
}

function reconstruct_nodes_in_place<E extends Graph<any, any>>(
    g: E,
    nodeMask: Uint8Array,
): E {
    const oldToNew = new Int32Array(g.nodes.length);
    oldToNew.fill(-1);

    const newNodes: typeof g.nodes = [];
    for (const node of g.nodes) {
        if (!has(nodeMask, node.index)) continue;

        const newIndex = newNodes.length;
        oldToNew[node.index] = newIndex;
        newNodes.push({
            data: node.data,
            index: newIndex,
        });
    }

    const newEdges: typeof g.edges = [];
    for (const edge of g.edges) {
        const a = edge.end_indices[0];
        const b = edge.end_indices[1];

        if (!has(nodeMask, a) || !has(nodeMask, b)) continue;

        newEdges.push({
            data: edge.data,
            index: newEdges.length,
            end_indices: [oldToNew[a]!, oldToNew[b]!],
        });
    }

    g.nodes = newNodes;
    g.edges = newEdges;
    return g;
}

function reconstruct_nodes_copy<E extends Graph<any, any>>(
    g: E,
    nodeMask: Uint8Array,
): E {
    const oldToNew = new Int32Array(g.nodes.length);
    oldToNew.fill(-1);

    const nodes: any[] = [];
    for (const node of g.nodes) {
        if (!has(nodeMask, node.index)) continue;

        oldToNew[node.index] = nodes.length;
        nodes.push(node.data);
    }

    const edges: { end_indices: [number, number]; data: E }[] = [];
    for (const edge of g.edges) {
        const a = edge.end_indices[0];
        const b = edge.end_indices[1];

        if (!has(nodeMask, a) || !has(nodeMask, b)) continue;

        edges.push({
            end_indices: [oldToNew[a]!, oldToNew[b]!],
            data: edge.data,
        });
    }

    return new Graph(nodes, edges as any) as E;
}

function reconstruct_edges_in_place<E extends Graph<any, any>>(
    g: E,
    edgeMask: Uint8Array,
): E {
    const newEdges: typeof g.edges = [];

    for (const edge of g.edges) {
        if (!has(edgeMask, edge.index)) continue;

        newEdges.push({
            data: edge.data,
            index: newEdges.length,
            end_indices: edge.end_indices,
        });
    }

    g.edges = newEdges;
    return g;
}

function reconstruct_edges_copy<E extends Graph<any, any>>(
    g: E,
    edgeMask: Uint8Array,
): E {
    const nodes = new Array<any>(g.nodes.length);
    for (let i = 0; i < g.nodes.length; i++) {
        nodes[i] = g.nodes[i]!.data;
    }

    const edges: { end_indices: [number, number]; data: E }[] = [];
    for (const edge of g.edges) {
        if (!has(edgeMask, edge.index)) continue;

        edges.push({
            end_indices: edge.end_indices,
            data: edge.data,
        });
    }

    return new Graph(nodes, edges as any) as any;
}

function reconstruct_subgraph_in_place<E extends Graph<any, any>>(
    g: E,
    nodeMask: Uint8Array,
    edgeMask: Uint8Array,
): E {
    const oldToNew = new Int32Array(g.nodes.length);
    oldToNew.fill(-1);

    const newNodes: typeof g.nodes = [];
    for (const node of g.nodes) {
        if (!has(nodeMask, node.index)) continue;

        const newIndex = newNodes.length;
        oldToNew[node.index] = newIndex;
        newNodes.push({
            data: node.data,
            index: newIndex,
        });
    }

    const newEdges: typeof g.edges = [];
    for (const edge of g.edges) {
        if (!has(edgeMask, edge.index)) continue;

        const a = edge.end_indices[0];
        const b = edge.end_indices[1];

        if (!has(nodeMask, a) || !has(nodeMask, b)) continue;

        newEdges.push({
            data: edge.data,
            index: newEdges.length,
            end_indices: [oldToNew[a]!, oldToNew[b]!],
        });
    }

    g.nodes = newNodes;
    g.edges = newEdges;
    return g;
}

function reconstruct_subgraph_copy<E extends Graph<any, any>>(
    g: E,
    nodeMask: Uint8Array,
    edgeMask: Uint8Array,
): E {
    const oldToNew = new Int32Array(g.nodes.length);
    oldToNew.fill(-1);

    const nodes: any[] = [];
    for (const node of g.nodes) {
        if (!has(nodeMask, node.index)) continue;

        oldToNew[node.index] = nodes.length;
        nodes.push(node.data);
    }

    const edges: { end_indices: [number, number]; data: E }[] = [];
    for (const edge of g.edges) {
        if (!has(edgeMask, edge.index)) continue;

        const a = edge.end_indices[0];
        const b = edge.end_indices[1];

        if (!has(nodeMask, a) || !has(nodeMask, b)) continue;

        edges.push({
            end_indices: [oldToNew[a]!, oldToNew[b]!],
            data: edge.data,
        });
    }

    return new Graph(nodes, edges as any) as any;
}
