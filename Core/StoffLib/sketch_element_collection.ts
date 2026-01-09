import { SketchElement, SketchElementCollectionLike } from "./types.js";
import Line from "./line.js";
import Point from "./point.js";
import Sketch from "./sketch";

export type LineSketchElementCollection = SketchElementCollection<Line>;
export type PointSketchElementCollection = SketchElementCollection<Point>;

export default class SketchElementCollection<Type extends SketchElement = SketchElement> extends Array<Type> implements SketchElementCollectionLike {
    constructor(
        arr: Type[] = []
    ) {
        super();
        Object.setPrototypeOf(arr, SketchElementCollection.prototype);
        return arr as SketchElementCollection<Type>;
    }

    copy() {
        return new SketchElementCollection([...this]);
    }

    get_points(): SketchElementCollection<Point> {
        return new SketchElementCollection(this.filter((p: SketchElement) => p instanceof Point));
    }

    get_lines(): SketchElementCollection<Line> {
        return new SketchElementCollection(this.filter((l: SketchElement) => l instanceof Line));
    }

    get_sketch() {
        if (this[0]) {
            return this[0].get_sketch();
        }
        return new Sketch();
    }

    filter(...args: Parameters<typeof Array.prototype.filter>) {
        return new SketchElementCollection(
            super.filter(...args)
        );
    }

    concat(...args: Parameters<typeof Array.prototype.concat>) {
        return new SketchElementCollection(
            super.concat(...args)
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
