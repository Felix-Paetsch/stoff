import { Matrix, Polygon, Polyline, Vector } from "@/Core/geometry";
import { Sketch } from "@/Core/sketch";
import { LengthGraph, ShapeGraph, VertexGraph } from "@/ProcArt/graph";
import {
    BooleanGrid,
    MatrixGrid,
    NumberGrid,
    Vec3Grid,
    VectorGrid
} from "@/ProcArt/grid";
import { GrayImage, RGBImage } from "@/ProcArt/image";

export type StoffSerializablePrimitive = {
    string: string;
    number: number;
    boolean: boolean;
    null: null;

    polygon: Polygon;
    polyline: Polyline;
    vector: Vector;
    matrix: Matrix;

    sketch: Sketch;

    rgb_image: RGBImage;
    gray_image: GrayImage;

    number_grid: NumberGrid;
    vector_grid: VectorGrid;
    matrix_grid: MatrixGrid;
    boolean_grid: BooleanGrid;
    vec3_grid: Vec3Grid;

    vertex_graph: VertexGraph;
    length_graph: LengthGraph;
    shape_graph: ShapeGraph;

    uint8_array: Uint8Array;
    number_array: number[];
    vector_array: Vector[];
};

export type StoffSerializable =
    | StoffSerializablePrimitive[keyof StoffSerializablePrimitive]
    | StoffSerializable[]
    | { [key: string]: StoffSerializable };

export type StoffSerializableTag =
    keyof StoffSerializablePrimitive | "object" | "array";
