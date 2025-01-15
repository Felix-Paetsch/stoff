import { assert } from 'console';
import ConnectedComponent from '../connected_component.js';
import { copy_connected_component } from '../copy.js';

export default (Sketch) => {
    Sketch.prototype.connected_component = function (sketch_el = null){
        if (sketch_el === null){
            const cc = this.get_connected_components();
            assert(cc.length == 1, "Sketch has more than one connected component or is empty.");
            return cc[0];
        }

        assert.HAS_SKETCH(sketch_el, this);
        if (sketch_el instanceof ConnectedComponent) return sketch_el;
        return new ConnectedComponent(sketch_el);
    }

    Sketch.prototype.delete_component = function (sketch_el){
        assert.HAS_SKETCH(sketch_el, this);
        if (sketch_el instanceof ConnectedComponent){
            this._delete_element_from_data(sketch_el);
            const pts = sketch_el.points();
            return this.remove_points(...pts);
        }

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

    Sketch.ConnectedComponent = ConnectedComponent;
}