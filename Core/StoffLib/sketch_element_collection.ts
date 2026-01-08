import { SketchElement, SketchElementCollectionLike } from "./types.js";
import Line from "./line.js";
import Point from "./point.js";
import Sketch from "./sketch";

export type LineSketchElementCollection = SketchElementCollection<Line>;
export type PointSketchElementCollection = SketchElementCollection<Point>;

export default class SketchElementCollection<Type extends SketchElement = SketchElement> extends Array<Type> implements SketchElementCollectionLike {
    constructor(
        arr: Type[] = [],
        readonly sketch: Sketch | null = null
    ) {
        super();
        Object.setPrototypeOf(arr, SketchElementCollection.prototype);
        (arr as any).sketch = sketch;
        return arr as SketchElementCollection<Type>;
    }

    copy() {
        return new SketchElementCollection([...this], this.sketch);
    }

    get_points() {
        return new SketchElementCollection(this.filter((p: SketchElement) => p instanceof Point));
    }

    get_lines() {
        return new SketchElementCollection(this.filter((l: SketchElement) => l instanceof Line));
    }

    get_sketch(ignore_error = false) {
        if (this.sketch) return this.sketch;
        if (ignore_error) return new Sketch();
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

    equals(se: SketchElementCollection<any>) {
        return se.length == this.length && !se.some(el => !this.includes(el));
    }
}
