import { ZERO, mirror_type } from '../geometry.js';


export default (Class, set_if_not_exists) => {
    set_if_not_exists(Class, "delete_sketch_elements", function(){
        const els = this.get_sketch_elements();
        els.get_lines().forEach(l => l.remove());
        els.get_points().forEach(l => l.remove());
    });
    
    set_if_not_exists(Class, "transform", function(pt_fun = (_pt) => {}){
            this.get_points().forEach(pt_fun);
            return this;
        }
    )

    set_if_not_exists(Class, "mirror", function(...args){
        if (args.length == 0) {
            args = [ZERO];
        }

        this.transform((pt) => pt.move_to(pt.mirror_at(...args)));
        if (mirror_type(...args) == "Line"){
            this.get_lines().forEach(l => l.mirror());
        }
        return this;
    })
}