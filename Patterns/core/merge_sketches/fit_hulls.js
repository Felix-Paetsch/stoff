// Import the Vector class
import { Vector, UP, LEFT, ZERO, bounding_box } from "../../../StoffLib/geometry.js";
import Sketch from "../../../StoffLib/sketch.js";
import Hull from "./hull.js";

export default function fit_hulls(hulls, grid_size = 10, min_padding, direction = false) {
    // Direction false (default): Fixed width (grid_size), minimize height
    // Direction true: Fixed height (grid_size), minimize width

    // Convert hulls to Hull instances
    hulls = hulls.map(hull => new Hull(hull));

    // Check that each hull can fit within the fixed dimension
    for (let i in hulls) {
        const fixedSize = direction ? hulls[i].bb.height : hulls[i].bb.width;
        const fixedDimension = direction ? 'height' : 'width';
        if (fixedSize > grid_size) {
            throw new Error(`Hull at index ${i} cannot fit within the fixed ${fixedDimension} ${grid_size}. Hull width: ${hulls[i].bb.width.toFixed(2)}, height: ${hulls[i].bb.height.toFixed(2)}`);
        }
    }

    // Unified placement variables
    let primaryPosition = 0;
    let secondaryPosition = 0;
    let maxSecondarySizeInLine = 0;

    // Determine the primary and secondary dimensions based on direction
    const primarySizeProp = direction ? 'height' : 'width'; // Fixed dimension
    const secondarySizeProp = direction ? 'width' : 'height'; // Variable dimension
    const primaryMinProp = direction ? 'y' : 'x';
    const secondaryMinProp = direction ? 'x' : 'y';
    const primaryPosProp = direction ? 'y' : 'x';
    const secondaryPosProp = direction ? 'x' : 'y';

    for (let h of hulls) {
        const hullPrimarySize = h.bb[primarySizeProp];
        const hullSecondarySize = h.bb[secondarySizeProp];

        // Check if the hull fits in the current line
        if (primaryPosition + hullPrimarySize <= grid_size) {
            // Place the hull at the current position
            const position = {};
            position[primaryPosProp] = primaryPosition - h.bb.top_left[primaryMinProp];
            position[secondaryPosProp] = secondaryPosition - h.bb.top_left[secondaryMinProp];
            h.set_offset(new Vector(position.x, position.y));

            primaryPosition += hullPrimarySize;
            if (hullSecondarySize > maxSecondarySizeInLine) {
                maxSecondarySizeInLine = hullSecondarySize;
            }
        } else {
            // Start a new line
            primaryPosition = 0;
            secondaryPosition += maxSecondarySizeInLine;
            maxSecondarySizeInLine = hullSecondarySize;

            const position = {};
            position[primaryPosProp] = primaryPosition - h.bb.top_left[primaryMinProp];
            position[secondaryPosProp] = secondaryPosition - h.bb.top_left[secondaryMinProp];
            h.set_offset(new Vector(position.x, position.y));

            primaryPosition += hullPrimarySize;
        }
    }

    const environment_data = {
        gravity_direction: direction ? LEFT : UP,
        gravity_strength: 0.001 * min_padding,
        bb: bounding_box(hulls.map(h => h.get_adjusted_hull()).flat()),
        hulls: hulls
    }

    //const r = new Sketch.dev.Recording();

    for (let i = 0; i < 500; i++){
        //const s = new Sketch();

        for (const i in hulls) {
            /*{
                const pts = [];
                const ah = hulls[i].get_adjusted_hull();
                for (let i = 0; i < ah.length; i++){
                    pts.push(
                        s.point(
                            ah[i]
                        ).set_color("red"));
                }
                for (let i = 0; i < pts.length; i++){
                    s.line_between_points(pts[i], pts[(i + 1) % pts.length]).set_color("red");
                }
            }*/

            hulls[i].apply_force(
                environment_data.gravity_direction.scale(environment_data.gravity_strength)
            );

            for (let j = +i+1; j < hulls.length; j++) {
                hulls[i].check_hull_collision(hulls[j]);
            }

            hulls[i].check_bb_collision(environment_data.bb);
            hulls[i].step();
        }

        //r.snapshot(s);
    }

    //r.at_url("/wha");

    return hulls.map(h => h.get_adjusted_hull());
}
