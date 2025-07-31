import { Vector, convex_hull } from '../geometry.js';
import { copy_sketch_element_collection } from "../copy.js";

export default (Class, set_if_not_exists) => {
    set_if_not_exists(Class, "get_bounding_box", function(){
        return calculate_bounding_box(this.get_sketch_elements());
    })

    set_if_not_exists(Class, "convex_hull", function(){
        const els = this.get_sketch_elements();

        return convex_hull(
            els.get_points().concat(els.get_lines().map(l => l.get_absolute_sample_points()).flat())
        );
    });

    set_if_not_exists(Class, "endpoint_hull", function(){
        const lines = this.get_lines();
        const points = this.get_points();
        lines.forEach(l => {
            if (!points.includes(l.p1)) points.push(l.p1);
            if (!points.includes(l.p2)) points.push(l.p2);
        });
        return this.make_sketch_element_collection(lines.concat(points));
    });

    set_if_not_exists(Class, "inner_line_hull", function(){
        const lines = this.get_lines();
        const points = this.get_points();
        for (let i = 0; i < points.length; i++){
            for (let j = i + 1; j < points.length; j++){
                const inner_lines = points[i].common_lines(points[j]);
                for (let k = 0; k < inner_lines.length; k++){
                    if (!lines.includes(inner_lines[k])){
                        lines.push(inner_lines[k]);
                    }
                }
            }
        }
        return this.make_sketch_element_collection(lines.concat(points));
    });

    set_if_not_exists(Class, "to_sketch",
        function(position = null){
            const s = new (this.get_sketch()).constructor();
            copy_sketch_element_collection(this, s, position);
            return s;
        }
    );

    set_if_not_exists(Class, "paste_to_sketch",
        function(target, position = null){
            return copy_sketch_element_collection(this, target, position);
        }
    );
}

export function calculate_bounding_box(sketch_elements, min_bb = [0,0]){
  let _min_x = Infinity;
  let _min_y = Infinity;
  let _max_x = - Infinity;
  let _max_y = - Infinity;

  if (sketch_elements.length == 0){
      return {
          width:  min_bb[0],
          height: min_bb[1],
          top_left:  new Vector(0,0),
          top_right: new Vector(0,0),
          bottom_left:  new Vector(0,0),
          bottom_right: new Vector(0,0)
      }
  }

  sketch_elements.forEach(l => {
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
}
