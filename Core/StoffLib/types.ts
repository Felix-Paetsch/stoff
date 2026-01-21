import { Point } from "./point";
import { Line } from "./line";

export type SketchElement = Point | Line;
export type SketchElementCollection<T extends SketchElement = SketchElement> = T[] | {
    get_sketch_elements: () => SketchElement[]
};

export type DropFirst<T extends any[]> = T extends [any, ...infer Rest]
    ? Rest
    : never;

export type StoffObjectData = Record<string, string>;
