import Point from "./point.js";
import Line from "./line.js";
import SketchElementCollection from "./sketch_element_collection.js";
import Sketch from "./sketch.js";
import ConnectedComponent from "./connected_component.js";

export type SketchElement = Point | Line;
export type SketchElementCollectionLike =
    SketchElementCollection | SketchElement | Sketch | ConnectedComponent;
export type SketchElementData = any;