import { Matrix, Polygon, Polyline, Vector } from "@/Core/geometry";
import { Json } from "@/Core/utils";
import {
    Graph,
    internal_is_length_graph,
    internal_is_vertex_graph
} from "@/ProcArt/graph";
import { Grid, InternalGrid } from "@/ProcArt/grid";
import { GrayImage, RGBImage } from "@/ProcArt/image";
import { Sketch } from "Core/sketch/sketch";
import {
    serialize_matrix,
    serialize_polygon,
    serialize_polyline,
    serialize_vector
} from "./geometry";
import {
    serialize_length_graph,
    serialize_shape_graph,
    serialize_vertex_graph
} from "./graph";
import {
    serialize_boolean_grid,
    serialize_matrix_grid,
    serialize_number_grid,
    serialize_vec3_grid,
    serialize_vector_grid
} from "./grid";
import { serialize_gray_image, serialize_rgb_image } from "./image";
import { stringify_f64_array, stringify_u8_array } from "./number_array";
import { serialize_sketch } from "./sketch";
import { StoffSerializable, StoffSerializableTag } from "./types";

export function serialize(r: StoffSerializable, max_depth = 5): string {
    return JSON.stringify(serialize_to_json(r, max_depth));
}

export function serialize_to_json(
    r: StoffSerializable,
    max_depth = 5
): {
    type: StoffSerializableTag;
    data: Json;
} {
    if (max_depth == 0) {
        throw new Error("Nested to deep!");
    }

    if (r instanceof Float64Array) {
        return {
            type: "number_array",
            data: stringify_f64_array(r)
        };
    }

    if (r instanceof Uint8Array) {
        return {
            type: "number_array",
            data: stringify_u8_array(r)
        };
    }

    if (typeof r == "string") {
        return {
            type: "string",
            data: r
        };
    }

    if (typeof r == "number") {
        return {
            type: "number",
            data: r
        };
    }

    if (typeof r == "boolean") {
        return {
            type: "boolean",
            data: r
        };
    }

    if (r == null) {
        return {
            type: "null",
            data: r
        };
    }

    if (r instanceof RGBImage) {
        return serialize_rgb_image(r);
    }

    if (r instanceof GrayImage) {
        return serialize_gray_image(r);
    }

    if (r instanceof Polyline) {
        return serialize_polyline(r);
    }

    if (r instanceof Polygon) {
        return serialize_polygon(r);
    }

    if (r instanceof Vector) {
        return serialize_vector(r);
    }

    if (r instanceof Matrix) {
        return serialize_matrix(r);
    }

    if (r instanceof Sketch) {
        return serialize_sketch(r);
    }

    if (r instanceof Grid) {
        const s = r as typeof r & InternalGrid;
        if (s.type == "number") {
            return serialize_number_grid(s);
        }

        if (s.type == "vector") {
            return serialize_vector_grid(s);
        }

        if (s.type == "vec3") {
            return serialize_vec3_grid(s);
        }

        if (s.type == "boolean") {
            return serialize_boolean_grid(s);
        }

        return serialize_matrix_grid(s);
    }

    if (r instanceof Graph) {
        if (internal_is_length_graph(r)) {
            return serialize_length_graph(r);
        }

        if (internal_is_vertex_graph(r)) {
            return serialize_vertex_graph(r);
        }

        return serialize_shape_graph(r);
    }

    if (Array.isArray(r)) {
        if (r.every((a) => typeof a == "number")) {
            return {
                type: "number_array",
                data: stringify_f64_array(r as number[])
            };
        }

        if (r.every((a) => a instanceof Vector)) {
            return {
                type: "vector_array",
                data: stringify_f64_array(
                    (r as Vector[]).flatMap((v) => [v.x, v.y])
                )
            };
        }

        return {
            type: "array",
            data: r.map((a) => serialize_to_json(a, max_depth - 1))
        };
    }

    return {
        type: "object",
        data: Object.fromEntries(
            Object.entries(r).map(([key, value]) => [
                key,
                serialize_to_json(value, max_depth - 1)
            ])
        )
    };
}
