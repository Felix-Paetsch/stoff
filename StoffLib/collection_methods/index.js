import register_getter_methods from "./getter_methods.js"
import register_sporadic_methods from "./sporadic_methods.js"
import register_element_wise_methods from "./element_wise_methods.js"

export default function register_collection_methods(Class){
    // We assume the class exposes the following:
    // .get_points()
    // .get_lines()
    // .get_sketch_elements()
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

    // For most methods, only add methods if not already present
    register_getter_methods(Class, set_if_not_exists);
    register_sporadic_methods(Class, set_if_not_exists);
    register_element_wise_methods(Class, set_if_not_exists);
}

function set_if_not_exists(Class, key, value){
    if (typeof Class.prototype[key] == "undefined"){
        Class.prototype[key] = value;
    }
}

// To fix import dependencies
let SketchElementCollection;