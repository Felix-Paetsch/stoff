// Decodes:

import { Vector } from "@/Core";
import { Graph } from "../Graph/graph";
export * from "./pkg/graphs";

// [num_vertices, v1x, v1y, v2x, v2y, ..., edge1Start, edge1End, edge2Start, edge2End, ...]
export function f64_to_undirected_graph(arr: Float64Array): Graph {
    if (arr.length === 0) {
        throw new Error("Input array is empty");
    }

    const numVerticesF = arr[0]!;

    const numVertices = numVerticesF;
    const vertexDataLen = 1 + numVertices * 2;

    if (arr.length < vertexDataLen) {
        throw new Error("Array too short for declared vertex count");
    }

    const remaining = arr.length - vertexDataLen;

    if (remaining % 2 !== 0) {
        throw new Error("Edge data must contain pairs of indices");
    }

    const vertices: Vector[] = new Array(numVertices);

    for (let i = 0; i < numVertices; i++) {
        const x = arr[1 + 2 * i]!;
        const y = arr[1 + 2 * i + 1]!;

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            throw new Error(`Invalid vertex coordinates at index ${i}`);
        }

        vertices[i] = new Vector(x, y);
    }

    const edges: [number, number][] = [];

    for (let i = vertexDataLen; i < arr.length; i += 2) {
        const a = arr[i]!;
        const b = arr[i + 1]!;

        edges.push([a, b]);
    }

    return new Graph(vertices, edges);
}

// Encodes:
// [num_vertices, v1x, v1y, v2x, v2y, ..., edge1Start, edge1End, edge2Start, edge2End, ...]
export function undirected_graph_to_f64_array(graph: Graph): Float64Array {
    const numVertices = graph.vertices.length;
    const out = new Float64Array(1 + numVertices * 2 + graph.edges.length * 2);

    let offset = 0;
    out[offset++] = numVertices;

    for (const v of graph.vertices) {
        out[offset++] = v.x;
        out[offset++] = v.y;
    }

    for (const [a, b] of graph.edges) {
        out[offset++] = a;
        out[offset++] = b;
    }

    return out;
}

// Decodes [(x1, y1), (x2, y2), ...] from flat array [x1, y1, x2, y2, ...]
export function f64_to_vec_array(arr: Float64Array): Vector[] {
    const out: Vector[] = new Array(arr.length / 2);

    for (let i = 0, j = 0; i < arr.length; i += 2, j++) {
        const x = arr[i]!;
        const y = arr[i + 1]!;

        out[j] = new Vector(x, y);
    }

    return out;
}

export function vec_array_to_f64_array(arr: Vector[]): Float64Array {
    const out = new Float64Array(arr.length * 2);

    let offset = 0;

    for (const v of arr) {
        if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) {
            throw new Error("Vector array contains invalid coordinates");
        }

        out[offset++] = v.x;
        out[offset++] = v.y;
    }

    return out;
}
