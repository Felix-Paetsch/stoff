import { Polygon, Polyline, Vector } from "@/Core/geometry";
import { LengthGraph, ShapeGraph, VertexGraph } from "@/ProcArt/graph";
import {
    BooleanGrid,
    MatrixGrid,
    NumberGrid,
    Vec3Grid,
    VectorGrid
} from "@/ProcArt/grid";
import { GrayImage, RGBImage } from "@/ProcArt/image";
import { SocketFailure } from "./socket/types";

export type PyTransmittablePrimitives = {
    string: string;
    number: number;
    boolean: boolean;
    null: null;

    rgb_image: RGBImage;
    gray_image: GrayImage;

    number_grid: NumberGrid;
    vector_grid: VectorGrid;
    matrix_grid: MatrixGrid;
    boolean_grid: BooleanGrid;
    vec3_grid: Vec3Grid;

    polygon: Polygon;
    polyline: Polyline;
    vector: Vector;

    vertex_graph: VertexGraph;
    length_graph: LengthGraph;
    shape_graph: ShapeGraph;

    float64_array: Float64Array;
    uint8_array: Uint8Array;

    number_array: number[];
    vector_array: Vector[];
};

export type PyTransmittable =
    | PyTransmittablePrimitives[keyof PyTransmittablePrimitives]
    | PyTransmittable[]
    | { [key: string]: PyTransmittable };

export type PyTransmittableTag =
    keyof PyTransmittablePrimitives | "object" | "array";

export type PyRequest = {
    method: string;
    arguments: PyTransmittable[];
};

export type PyFailureReason =
    | SocketFailure["reason"]
    | "unknown_method"
    | "internal_error"
    | "invalid_arguments"
    | "serialization_error"
    | "deserialization_error";

export type PyResponse =
    | {
          ok: true;
          result: PyTransmittable;
      }
    | {
          ok: false;
          reason: PyFailureReason;
          data?: string;
      };
