import register_collection_methods from "./collection_methods/index.js"
import { SketchElement } from "./types.js";
import Line from "./line.js";
import Point from "./point.js";
import Sketch from "./sketch.js";

export type LineSketchElementCollection = SketchElementCollection & Line[];
export type PointSketchElementCollection = SketchElementCollection & Point[];

export default class SketchElementCollection extends Array<SketchElement> {
    constructor(
        arr: SketchElement[],
        readonly sketch: Sketch | null = null
    ) {
        super();
        Object.setPrototypeOf(arr, SketchElementCollection.prototype);
        (arr as any).sketch = sketch;
        return arr as SketchElementCollection;
    }

    copy() {
        return new SketchElementCollection([...this], this.sketch);
    }

    get_points() {
        return this.filter((p: SketchElement) => p instanceof Point);
    }

    get_lines() {
        return this.filter((l: SketchElement) => l instanceof Line);
    }

    get_sketch(ignore_error = false) {
        if (this.sketch) return this.sketch;
        if (ignore_error) return null;
        throw new Error("SketchElementCollection doesn't have an associated sketch.");
    }

    filter(...args: Parameters<typeof Array.prototype.filter>) {
        return new SketchElementCollection(
            super.filter(...args), this.sketch
        );
    }

    concat(...args: Parameters<typeof Array.prototype.concat>) {
        return new SketchElementCollection(
            super.concat(...args), this.sketch
        );
    }

    remove(...args: SketchElement[]) {
        return this.filter(a => !args.includes(a));
    }

    static get [Symbol.species]() {
        return Array;
    }

    toString() {
        return "[SketchElementCollection]"
    }

    equals(se: SketchElementCollection) {
        return se.length == this.length && !se.some(el => !this.includes(el));
    }
}

register_collection_methods(SketchElementCollection);

Object.keys(SketchElementCollection.prototype)
    .filter(k => k.startsWith("get") && (k !== "get_bounding_box")).forEach(key => {
        (SketchElementCollection as any).prototype[
            ("remove" + key.slice(3)) as any
        ] = function (...args: any[]) {
            return this.remove(this[key](...args));
        }
    });
