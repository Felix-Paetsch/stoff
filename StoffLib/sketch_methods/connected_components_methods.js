import { ConnectedComponent } from '../connected_component.js';
import { copy_connected_component } from '../copy.js';

export default (Sketch) => {
    Sketch.connected_component = function (sketch_el){
        this._guard_sketch_elements_in_sketch(sketch_el);
        return ConnectedComponent(sketch_el);
    }

    Sketch.delete_component = function (sketch_el){
        if (sketch_el instanceof ConnectedComponent){
            this.delete_element_from_data(sketch_el);
            this._guard_sketch_elements_in_sketch(sketch_el.root_el);


            const pts = sketch_el.points();
            return this.remove_points(...pts);
        }

        this._guard_sketch_elements_in_sketch(sketch_el);
        return this.remove_points(...ConnectedComponent(sketch_el).points());
    }

    Sketch.get_connected_components = function(){
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

    Sketch.paste_connected_component = function(cc, position){
        return copy_connected_component(cc, this, position);
    }
}