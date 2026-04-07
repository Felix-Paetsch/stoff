import { LineSegment } from "./types";
import { Shape } from "./shape/shape";
import { Vector } from "./vector";

export type FiniteGeometry = Vector | LineSegment | Shape;
