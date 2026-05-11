import { UnionFind } from "Core/utils/unionfind";
import { Graph } from "../graph";

export function remove_dublicate_edges<E extends Graph<any, any>>(
    g: E,
    cb: (
        x: Graph.ExtractEdgeType<E>,
        y: Graph.ExtractEdgeType<E>,
    ) => boolean = (x, y) => x === y,
): E {
    const groups = new Map<string, typeof g.edges>();

    for (const edge of g.edges) {
        const [a, b] = edge.end_indices;
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        const bucket = groups.get(key);

        if (bucket === undefined) {
            groups.set(key, [edge]);
        } else {
            bucket.push(edge);
        }
    }

    const new_edges: typeof g.edges = [];

    for (const bucket of groups.values()) {
        const uf = new UnionFind(bucket.length);

        for (let i = 0; i < bucket.length; i++) {
            for (let j = i + 1; j < bucket.length; j++) {
                if (cb(bucket[i]!.data, bucket[j]!.data)) {
                    uf.union(i, j);
                }
            }
        }

        const kept = new Set<number>();

        for (let i = 0; i < bucket.length; i++) {
            kept.add(uf.find(i));
        }

        for (let i = 0; i < bucket.length; i++) {
            if (kept.has(i)) {
                new_edges.push(bucket[i]!);
            }
        }
    }

    g.edges = new_edges;
    g.edges.forEach((e, i) => (e.index = i));

    return g;
}

export function identify_nodes<E extends Graph<any, any>>(
    g: E,
    cb: (
        x: Graph.ExtractNodeType<E>,
        y: Graph.ExtractNodeType<E>,
    ) => boolean = (x, y) => x === y,
): E {
    const uf = new UnionFind(g.nodes.length);

    for (let i = 0; i < g.nodes.length; i++) {
        for (let j = i + 1; j < g.nodes.length; j++) {
            if (cb(g.nodes[i]!.data, g.nodes[j]!.data)) {
                uf.union(i, j);
            }
        }
    }

    const representative_to_new_index = new Map<number, number>();
    const old_index_to_new_index = new Map<number, number>();
    const new_nodes: typeof g.nodes = [];

    for (const node of g.nodes) {
        const representative = uf.find(node.index);
        let new_index = representative_to_new_index.get(representative);

        if (new_index === undefined) {
            new_index = new_nodes.length;
            representative_to_new_index.set(representative, new_index);
            new_nodes.push({
                data: g.nodes[representative]!.data,
                index: new_index,
            });
        }

        old_index_to_new_index.set(node.index, new_index);
    }

    g.nodes = new_nodes;

    g.edges.forEach((e) => {
        e.end_indices = [
            old_index_to_new_index.get(e.end_indices[0])!,
            old_index_to_new_index.get(e.end_indices[1])!,
        ];
    });

    return g;
}
