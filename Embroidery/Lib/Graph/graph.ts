import { Vector } from "@/Core";
import {
    wasm_graph_minimum_spanning_tree,
    wasm_graph_minimum_spanning_tree_on_vertices,
    WASMCompatability,
} from "Rust/exports";

export class Graph {
    constructor(
        public vertices: Vector[] = [],
        public edges: [number, number][] = [],
    ) {}

    minimum_spanning_tree(): Graph {
        const g = this.to_wasm_vecf64();
        const res = wasm_graph_minimum_spanning_tree(g);
        return WASMCompatability.Graph.vecf64_to_graph(res!);
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
        if (on instanceof Graph) return on.minimum_spanning_tree();

        const arr = WASMCompatability.Geometry.vertex_vec_to_vecf64(on);
        const res = wasm_graph_minimum_spanning_tree_on_vertices(arr);
        return WASMCompatability.Graph.vecf64_to_graph(res!);
    }

    to_wasm_vecf64(): Float64Array {
        return WASMCompatability.Graph.graph_to_vecf64(this);
    }

    static from_wasm_vecf64(from: Float64Array): Graph {
            return WASMCompatability.Graph.vecf64_to_graph(from)!;
    }
}
