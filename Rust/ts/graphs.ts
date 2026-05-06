import { Vector } from "@/Core";
import { Graph } from "Embroidery/Lib/index";

export function vecf64_to_graph(arr: Float64Array): Graph {
    const vert_count = Math.round(arr[0]!);
    let offset = 1;

    const verts: Vector[] = [];
    for (let i = 0; i < vert_count; i++) {
        verts.push(new Vector(arr[offset++]!, arr[offset++]!));
    }

    const edges: [number, number][] = [];
    for (let i = 0; i < arr.length - 1 - 2 * vert_count; i += 2) {
        edges.push([Math.round(arr[offset++]!), Math.round(arr[offset++]!)]);
    }

    return new Graph(verts, edges);
}

export function graph_to_vecf64(g: Graph): Float64Array {
    const res = new Float64Array(
        1 + 2 * g.vertices.length + 2 * g.edges.length,
    );
    let offset = 0;
    res[offset++] = g.vertices.length;
    for (const v of g.vertices) {
        res[offset++] = v.x;
        res[offset++] = v.y;
    }

    for (const e of g.edges) {
        res[offset++] = e[0];
        res[offset++] = e[1];
    }

    return res;
}
