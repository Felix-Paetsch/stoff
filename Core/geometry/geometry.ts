import { Line } from "./line";
import { Ray } from "./ray";
import { Shape } from "./shape/shape";
import { LineSegment } from "./types";
import { Vector } from "./vector";

export type Geometry = Vector | Line | Ray | LineSegment | Shape;

export { closest_vectors } from "./geometry/closest_vector";
