import { ConnectedComponent } from '../connected_component.js';
import { copy_connected_component } from '../copy.js';

export default (Sketch) => {
    Sketch.prototype.connected_component = function (sketch_el){
        this._guard_sketch_elements_in_sketch(sketch_el);
        return new ConnectedComponent(sketch_el);
    }

    Sketch.prototype.delete_component = function (sketch_el){
        if (sketch_el instanceof ConnectedComponent){
            this.delete_element_from_data(sketch_el);
            this._guard_sketch_elements_in_sketch(sketch_el.root_el);


            const pts = sketch_el.points();
            return this.remove_points(...pts);
        }

        this._guard_sketch_elements_in_sketch(sketch_el);
        return this.remove_points(...(new ConnectedComponent(sketch_el)).points());
    }

    Sketch.prototype.get_connected_components = function(){
        const components = [];
        const visited_points = [];
        for (const p of this.points){
            if (!visited_points.includes(p)){
                const new_component = new ConnectedComponent(p);
                components.push(new_component);
                visited_points.push(...new_component.points());
            }
        }

        return components;
    }

    Sketch.prototype.paste_connected_component = function(cc, position){
        return copy_connected_component(cc, this, position);
    }
}