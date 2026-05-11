import { Shape, Vector } from "@/Core";
import { Graph } from "Core/graph/index";
import { geometry_to_vecf64, vecf64_to_geometry } from "../geometry/index";
import { TransmittableGraph } from "./types";

export function graph_to_transmittable_graph(
    g: TransmittableGraph,
): Float64Array {
    const out: number[] = [];

    const sampleNode = g.nodes[0];
    const nodeType =
        sampleNode !== undefined && sampleNode.data instanceof Vector ? 1 : 0;

    const sampleEdge = g.edges[0];
    let edgeType: number;
    if (sampleEdge === undefined) {
        edgeType = 0;
    } else if (typeof sampleEdge.data === "number") {
        edgeType = 2;
    } else if (sampleEdge.data !== undefined) {
        edgeType = 1;
    } else {
        edgeType = 0;
    }

    out.push(nodeType, edgeType, g.nodes.length);

    for (const node of g.nodes) {
        out.push(node.index);
        if (nodeType === 1) {
            const v = node.data as Vector;
            out.push(v.x, v.y);
        }
    }

    for (const edge of g.edges) {
        out.push(edge.index, edge.end_indices[0], edge.end_indices[1]);

        if (edgeType === 1) {
            const geom = geometry_to_vecf64(edge.data as Shape.Shape);
            out.push(...geom, NaN);
        } else if (edgeType === 2) {
            out.push(edge.data as number);
        }
    }

    return new Float64Array(out);
}

export function transmittable_graph_to_graph(
    arr: Float64Array,
): TransmittableGraph {
    const nodeType = arr[0]!;
    const edgeType = arr[1]!;
    const nodeCount = arr[2]!;

    let i = 3;

    const nodeData: (undefined | Vector)[] = [];
    for (let n = 0; n < nodeCount; n++) {
        i++; // skip id
        if (nodeType === 1) {
            nodeData.push(new Vector(arr[i]!, arr[i + 1]!));
            i += 2;
        } else {
            nodeData.push(undefined);
        }
    }

    const edgeArgs: { end_indices: [number, number]; data: any }[] = [];
    while (i < arr.length) {
        i++; // skip id
        const start = arr[i++]!;
        const end = arr[i++]!;

        if (edgeType === 0) {
            edgeArgs.push({ end_indices: [start, end], data: undefined });
        } else if (edgeType === 1) {
            const shapeStart = i;
            while (!Number.isNaN(arr[i])) i++;
            const shape = vecf64_to_geometry(arr.slice(shapeStart, i));
            i++; // skip NaN
            edgeArgs.push({ end_indices: [start, end], data: shape });
        } else {
            const length = arr[i++]!;
            edgeArgs.push({ end_indices: [start, end], data: length });
        }
    }

    return new Graph(nodeData, edgeArgs) as TransmittableGraph;
}
