import SketchElementCollection from "../sketch_element_collection.js";
import { SketchElementCollectionLike } from "../types.js";

export function to_sketch_element_collection(ec: SketchElementCollectionLike) {
    return new SketchElementCollection([...ec.get_lines(), ...ec.get_lines()]);
};

export * from "./element_wise_methods";
export * from "./filter";
export * from "./getter_methods";
export * from "./sporadic_methods"; 
