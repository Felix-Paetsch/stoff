import Point from "./point.js";
import Line from "./line.js";

export type SketchElement = Point | Line;
export type SketchElementCollection<T extends SketchElement = SketchElement> = T[] | {
    get_sketch_elements: () => SketchElement[]
};

export type SketchElementData = any;
