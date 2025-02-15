import register_collection_methods from "./collection_methods/index.js"

export default class SketchElementCollection extends Array{
    constructor(arr, sketch=null){
        super(...arr);
        this.sketch = sketch || null;
    }

    static from_array(arr, sketch = null) {
        Object.setPrototypeOf(arr, SketchElementCollection.prototype);
        arr.sketch = sketch;
        return arr;
    }

    get_points(){
        return this.filter(p => p instanceof Point);
    }

    get_lines(){
        return this.filter(l => l instanceof Line);
    }

    get_sketch_elements(){
        return this;
    }

    get_sketch(ignore_error = false){
        if (this.sketch) return this.sketch;
        if (ignore_error) return null;
        throw new Error("SketchElementCollection doesn't have an associated sketch.");
    }

    filter(...args){
        return SketchElementCollection.from_array(
            super.filter(...args), this.sketch
        );
    }

    static get [Symbol.species]() {
        return Array;
    }
}

register_collection_methods(SketchElementCollection);