import { Vector } from "@/Core";
import {
    f64_to_undirected_graph,
    minimum_spanning_tree_on_graph,
    minimum_spanning_tree_on_vertices,
    undirected_graph_to_f64_array,
    vec_array_to_f64_array,
} from "../rust/exports";

export class Graph {
    constructor(
        public vertices: Vector[] = [],
        public edges: [number, number][] = [],
    ) {}

    minimum_spanning_tree(): Graph {
        const graph = undirected_graph_to_f64_array(this);
        const mst = minimum_spanning_tree_on_graph(graph)!;
        return f64_to_undirected_graph(mst);
    }

    add_vertex(v: Vector) {
        this.vertices.push(v);
        return this.vertices.length - 1;
    }

    remove_vertex(i: number): Vector | null {
        if (i > this.vertices.length - 1) return null;

        let res: Vector;
        if (i !== this.vertices.length - 1) {
            res = this.vertices[i]!;
            this.vertices[i] = this.vertices.pop()!;
            this.edges = this.edges.flatMap((item) => {
                if (item[0] == i || item[1] == i) {
                    return [];
                }

                if (item[0] == this.vertices.length) {
                    item[0] = i;
                }

                if (item[1] == this.vertices.length) {
                    item[1] = i;
                }
                return [item];
            });
        } else {
            res = this.vertices.pop()!;
            this.edges = this.edges.filter((item) => {
                return item[0] == i || item[1] == i;
            });
        }

        return res;
    }

    remove_duplicate_edges() {
        const seen = new Set<string>();

        this.edges = this.edges.filter(([a, b]) => {
            const key = a < b ? `${a}-${b}` : `${b}-${a}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    static empty() {
        return new Graph([], []);
    }

    static minimum_spanning_tree(on: Vector[] | Graph): Graph {
        if (Array.isArray(on)) {
            const arr = vec_array_to_f64_array(on);
            const mst = minimum_spanning_tree_on_vertices(arr)!;
            return f64_to_undirected_graph(mst);
        }

        return on.minimum_spanning_tree();
    }
}
