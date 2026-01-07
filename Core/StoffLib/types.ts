import Point from "./point.js";
import Line from "./line.js";
import Sketch from "./sketch";
import SketchElementCollection from "./sketch_element_collection.js";

export type SketchElement = Point | Line;

export interface SketchElementCollectionLike {
    get_points(): SketchElementCollection<Point>;
    get_lines(): SketchElementCollection<Line>;
    get_sketch(): Sketch | null;
}

export type SketchElementData = any;
