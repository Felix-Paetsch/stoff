import register_getter_methods from "./getter_methods.js"
import register_sporadic_methods from "./sporadic_methods.js"
import register_element_wise_methods from "./element_wise_methods.js"
import register_connected_components_methods from "./connected_components_methods.js";

export default function register_collection_methods(Class){
    // We assume the class exposes the following:
    // .get_points()
    // .get_lines()
    // .get_sketch()

    if(Class.name == "SketchElementCollection"){
        SketchElementCollection = Class;
    }

    Class.prototype.make_sketch_element_collection = function(arr){
        return SketchElementCollection.from_array(arr, this.get_sketch(true));
    }

    Class.prototype.new_sketch_element_collection = function(){
        return new SketchElementCollection([], this.get_sketch(true));
    }

    Class.prototype.to_sketch_element_array = function(){
        return this.make_sketch_element_collection(this.get_sketch_elements());
    }

    Class.prototype.object_to_sketch_element_collection = function(obj, points = null, lines = null, sketch = null){
        // If points or lines are not given, we assume they are already the keys of the object.
        const r = new SketchElementCollection([...(points || obj.points || []), ...(lines || obj.lines || [])], sketch || this.get_sketch(true))
        return Object.assign(r, obj);
    }

    set_if_not_exists(Class, "get_sketch_elements", function(){
        const pts = this.get_points();
        const lns = this.get_lines();
        const res = lns.concat(pts);
        res.points = pts;
        res.lines  = lns;
        return res;
    });

    set_if_not_exists(Class, "obj", function(){
        return this.get_sketch_elements();
    });

    // For most methods, only add methods if not already present
    register_getter_methods(Class, set_if_not_exists);
    register_sporadic_methods(Class, set_if_not_exists);
    register_element_wise_methods(Class, set_if_not_exists);
    register_connected_components_methods(Class, set_if_not_exists);
}

function set_if_not_exists(Class, key, value){
    if (typeof Class.prototype[key] == "undefined"){
        Class.prototype[key] = value;
    }
}

// To fix import dependencies
var SketchElementCollection;