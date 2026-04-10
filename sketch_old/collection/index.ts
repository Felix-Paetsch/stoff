import { SketchElement, SketchElementCollection } from "../types";

export function sketch_element_collection_as_array<T extends SketchElement>(
    e: SketchElementCollection<T>,
): T[] {
    if (e instanceof Array) {
        return e;
    }
    return e.get_sketch_elements() as T[];
}

export * from "./collection_methods/element_wise_methods";
export * from "./collection_methods/filter";
export * from "./collection_methods/getter_methods";
export * from "./collection_methods/sporadic_methods";
