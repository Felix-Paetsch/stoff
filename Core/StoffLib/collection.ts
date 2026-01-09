import SketchElementCollection from "./sketch_element_collection.js";
import { SketchElementCollectionLike } from "./types.js";

export function to_sketch_element_collection(ec: SketchElementCollectionLike) {
    return new SketchElementCollection([...ec.get_lines(), ...ec.get_lines()]);
};

export * from "./collection_methods/element_wise_methods";
export * from "./collection_methods/filter";
export * from "./collection_methods/getter_methods";
export * from "./collection_methods/sporadic_methods"; 
