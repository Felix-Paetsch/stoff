import assert from "../../../StoffLib/assert.js";
import { arc } from "../../../StoffLib/curves.js";

export default class HeartSide{
    constructor(top, bottom, first_line){
        this.top  = top;
        this.bottom = bottom;
        this.sketch = top.sketch;

        this.wing_added = !first_line.has_endpoint(bottom);
        this.line = first_line;
    }

    orientation(){
        return - Math.sign(this.line.get_tangent_vector(this.top).x);
    }

    has_wing(){
        return this.wing_added;
    }

    wing(scale = 1){
        assert(!this.has_wing(), "We already have a wing.");
        
        const orientation = this.orientation();

        const p1 = this.sketch.point(orientation * (.6 + .2 * scale), -.2 -.3 * scale);
        const p15 = this.sketch.point(orientation * (.75 + .6 * scale), -.1 - 0.1 * scale);
        const p2 = this.sketch.point(orientation * (.65 + .7 * scale), .4);
        const p3 = this.sketch.point(orientation * (.2 + .7 * scale), .8);

        this.sketch.plot(p1, p15, arc(-orientation * 0.2));
        this.sketch.plot(p15, p2, arc(-orientation * 0.2));
        this.sketch.plot(p2, p3, arc(-orientation * 0.1));

        const heart_line = this.line;
        const proj1 = this.sketch.add(heart_line.closest_position(p1));
        const proj2 = this.sketch.add(heart_line.closest_position(p3));
        
        const r1 = this.sketch.point_on_line(proj1, heart_line);
        const [cs1, temp1] = r1.line_segments[0].has_endpoint(this.top) ? r1.line_segments : [
            r1.line_segments[1], 
            r1.line_segments[0]
        ];

        const r2 = this.sketch.point_on_line(proj2, temp1);
        const [cs2, _temp2] = r2.line_segments[0].has_endpoint(this.top) ? r2.line_segments : [
            r2.line_segments[1], 
            r2.line_segments[0]
        ];
        
        this.sketch.line_between_points(p1, cs1.other_endpoint(this.top));
        this.sketch.line_between_points(p3, cs2.other_endpoint(this.bottom));

        this.wing_added = true;
    }
}