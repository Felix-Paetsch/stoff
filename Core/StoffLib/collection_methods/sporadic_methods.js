import { Vector, convex_hull, ZERO, mirror_type } from '../geometry.js';

export default (Class, set_if_not_exists) => {
    Class.prototype.transform = function(pt_fun = (_pt) => {}){
        this.get_points().forEach(pt_fun);
        return this;
    }
    
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
    
    set_if_not_exists(Class, "get_bounding_box", function(min_bb = [0,0]){
        // min_bb sets minimal required width and height for a bb
        // the bb will be made bigger to hit these limits if needed
        const elements = this.get_sketch_elements();

        let _min_x = Infinity;
        let _min_y = Infinity;
        let _max_x = - Infinity;
        let _max_y = - Infinity;

        if (elements.length == 0){
            return {
                width:  min_bb[0],
                height: min_bb[1],
                top_left:  new Vector(0,0),
                top_right: new Vector(0,0),
                bottom_left:  new Vector(0,0),
                bottom_right: new Vector(0,0)
            }
        }

        elements.forEach(l => {
            const { top_left, bottom_right } = l.get_bounding_box();

            _min_x = Math.min(top_left.x, _min_x);
            _max_x = Math.max(bottom_right.x, _max_x);
            _min_y = Math.min(top_left.y, _min_y);
            _max_y = Math.max(bottom_right.y, _max_y);
        });

        const width_to_needed_diff  = Math.max(0, min_bb[0] - (_max_x - _min_x));
        const height_to_needed_diff = Math.max(0, min_bb[1] - (_max_y - _min_y));

        _min_x = _min_x - width_to_needed_diff/2;
        _max_x = _max_x + width_to_needed_diff/2;
        _min_y = _min_y - height_to_needed_diff/2;
        _max_y = _max_y + height_to_needed_diff/2;

        return {
            width:  _max_x - _min_x,
            height: _max_y - _min_y,
            top_left:  new Vector(_min_x, _min_y),
            top_right: new Vector(_max_x, _min_y),
            bottom_left:  new Vector(_min_x, _max_y),
            bottom_right: new Vector(_max_x, _max_y)
        }
    })

    set_if_not_exists(Class, "convex_hull", function(){
        const els = this.get_sketch_elements();

        return convex_hull(
            els.get_points().concat(els.get_lines().map(l => l.get_absolute_sample_points()).flat())
        );
    })
}