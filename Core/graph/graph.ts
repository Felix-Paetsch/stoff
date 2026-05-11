import { Expect } from "@/Core";

export namespace Graph {
    export type Edge<EdgeData = undefined> = {
        end_indices: [number, number];
        data: EdgeData;
        index: number;
    };

    export type Node<NodeData = undefined> = {
        data: NodeData;
        index: number;
    };

    export type NodeDescriptor<NodeData> = Node<NodeData> | number;
    export type EdgeDescriptor<EdgeData> = Edge<EdgeData> | number;

    export type ExtractNodeType<G> = G extends Graph<infer N, any> ? N : never;
    export type ExtractEdgeType<G> =
        G extends Graph<any, infer Edges> ? Edges : never;
}

// Note a graph may have many edges between nodes
// but for now always is undirected
export class Graph<NodeData = undefined, EdgeData = undefined> {
    declare Edge: Graph.Edge<EdgeData>;
    declare Node: Graph.Node<NodeData>;
    declare EdgeD: Graph.EdgeDescriptor<EdgeData>;
    declare NodeD: Graph.NodeDescriptor<NodeData>;

    public nodes: (typeof this.Node)[] = [];
    public edges: (typeof this.Edge)[];

    constructor(
        nodes: NodeData[],
        ...edges:
            | [
                  edges: (EdgeData extends undefined
                      ?
                            | {
                                  end_indices: [number, number];
                                  data: EdgeData;
                              }
                            | [number, number]
                      : {
                            end_indices: [number, number];
                            data: EdgeData;
                        })[],
              ]
            | []
    ) {
        this.nodes = nodes.map((n, i) => ({
            data: n,
            index: i,
        }));

        const fedges = edges[0] ?? [];
        this.edges = fedges.map((a, index) => {
            if (Array.isArray(a)) {
                return {
                    end_indices: a as [number, number],
                    data: undefined as EdgeData,
                    index,
                };
            }

            return {
                ...(a as {
                    end_indices: [number, number];
                    data: EdgeData;
                }),
                index,
            };
        });
    }

    is_empty() {
        return this.nodes.length == 0;
    }

    is_connected(): boolean {
        if (this.nodes.length === 0) return true;

        const visited = new Array(this.nodes.length).fill(false);
        const stack = [0];
        visited[0] = true;

        while (stack.length > 0) {
            const v = stack.pop()!;

            for (const e of this.edges_at(v)) {
                const u = this.other_node(e, v).index;
                if (!visited[u]) {
                    visited[u] = true;
                    stack.push(u);
                }
            }
        }

        return visited.every(Boolean);
    }

    add_node(
        ...v: NodeData extends undefined ? [] | [v: NodeData] : [v: NodeData]
    ) {
        const node = {
            data: v[0] as NodeData,
            index: this.nodes.length,
        };
        this.nodes.push(node);
        return this.nodes.length - 1;
    }

    remove_node(descr: typeof this.NodeD): NodeData | null {
        const i = this.graph_node_descriptor_to_node(descr).index;

        let res: NodeData;
        if (i !== this.nodes.length - 1) {
            res = this.nodes[i]!.data;
            this.nodes[i] = this.nodes.pop()!;
            this.nodes[i].index = i;
            this.edges = this.edges.flatMap((item) => {
                if (item.end_indices.includes(i)) {
                    return [];
                }

                if (item.end_indices[0] == this.nodes.length) {
                    item.end_indices[0] = i;
                }

                if (item.end_indices[1] == this.nodes.length) {
                    item.end_indices[1] = i;
                }
                return [item];
            });
        } else {
            res = this.nodes.pop()!.data;
            this.edges = this.edges.filter((item) => {
                return !item.end_indices.includes(i);
            });
            this.edges.forEach((e, i) => (e.index = i));
        }

        return res;
    }

    add_edge(
        from: number,
        to: number,
        ...data: EdgeData extends undefined
            ? [] | [data: EdgeData]
            : [data: EdgeData]
    ) {
        this.edges.push({
            end_indices: [from, to],
            data: data[0] as EdgeData,
            index: this.edges.length,
        });
    }

    remove_edge(descr: typeof this.EdgeD): EdgeData {
        const index = this.graph_edge_descriptor_to_edge(descr).index;
        const res = this.edges.splice(index, 1)[0]!;
        this.edges.map((e, i) => (e.index = i));
        return res.data;
    }

    static empty() {
        return new Graph([], []);
    }

    node_data(index: number): NodeData {
        return Expect.defined(this.nodes[index]).data;
    }

    edge_data(index: number): EdgeData {
        return Expect.defined(this.edges[index]).data;
    }

    edges_at(descr: typeof this.NodeD): (typeof this.Edge)[] {
        const node = this.graph_node_descriptor_to_node(descr);
        return this.edges.filter((e) => e.end_indices.includes(node.index));
    }

    endpoints(descr: typeof this.EdgeD): [typeof this.Node, typeof this.Node] {
        const edge = this.graph_edge_descriptor_to_edge(descr);
        return [
            this.graph_node_descriptor_to_node(edge.end_indices[0]),
            this.graph_node_descriptor_to_node(edge.end_indices[1]),
        ];
    }

    other_node(
        edge: typeof this.EdgeD,
        node: typeof this.NodeD,
    ): typeof this.Node {
        edge = this.graph_edge_descriptor_to_edge(edge);
        node = this.graph_node_descriptor_to_node(node);

        if (edge.end_indices[0] == node.index)
            return this.graph_node_descriptor_to_node(edge.end_indices[1]);

        return this.graph_node_descriptor_to_node(edge.end_indices[0]);
    }

    graph_edge_descriptor_to_edge(descr: typeof this.EdgeD): typeof this.Edge {
        if (typeof descr == "number") {
            return Expect.defined(this.edges[descr]);
        }

        return Expect.defined(this.edges[descr.index]);
    }

    graph_node_descriptor_to_node(descr: typeof this.NodeD): typeof this.Node {
        if (typeof descr == "number") {
            return Expect.defined(this.nodes[descr]);
        }

        return Expect.defined(this.nodes[descr.index]);
    }

    map<N, E>(
        map_node: (n: NodeData, node: Graph.Node<NodeData>) => N,
        map_edge: (n: EdgeData, node: Graph.Edge<EdgeData>) => E,
    ): Graph<N, E> {
        return new Graph(
            this.nodes.map((n) => map_node(n.data, n)),
            this.edges.map(
                (e) =>
                    ({
                        data: map_edge(e.data, e),
                        end_indices: e.end_indices,
                    }) as any,
            ),
        );
    }
}
