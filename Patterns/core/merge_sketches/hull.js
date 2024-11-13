import { Vector, bounding_box, ZERO } from "../../../StoffLib/geometry.js";

export default class Hull {
    constructor(hull) {
        this.hull = hull;
        this.relative_offset = new Vector(0, 0);
        
        this.bb = bounding_box(this.hull);
        this.length = hull.length;

        // Physics Sim
        this.force = ZERO;
        this.velocity = ZERO;
    }

    set_offset(vec) {
        this.relative_offset = vec;
        return this;
    }

    get_adjusted_hull() {
        return this.hull.map(v => v.add(this.relative_offset));
    }

    get_adjusted_bb(){
        return {
            top_left: this.bb.top_left.add(this.relative_offset),
            top_right: this.bb.top_right.add(this.relative_offset),
            bottom_left: this.bb.bottom_left.add(this.relative_offset),
            bottom_right: this.bb.bottom_right.add(this.relative_offset),
            left: this.bb.top_left.x + this.relative_offset.x,
            right: this.bb.top_right.x + this.relative_offset.x,
            top: this.bb.top_left.y + this.relative_offset.y,
            bottom: this.bb.bottom_left.y + this.relative_offset.y,
            width: this.bb.width,
            height: this.bb.height
        };
    }

    at(n) {
        return this.hull[n].add(this.relative_offset);
    }

    // Physics Sim
    reset_force(){
        this.force = ZERO;
    }

    apply_force(vec){
        this.force = this.force.add(vec);
    }

    step(){
        this.velocity = this.velocity.add(this.force);
        this.relative_offset = this.relative_offset.add(this.velocity);
        this.force = ZERO;
    }

    // Collisions
    check_bb_collision(env_bb) {
        /*
            Check if hull has any part outside the bounding box.
            If so, adjust the relative_offset to bring the hull back inside.
            Remove the velocity and force components in that direction.
        */

        // Current position of the hull's bounding box
        const current_bb_left = this.bb.top_left.x + this.relative_offset.x;
        const current_bb_right = this.bb.bottom_right.x + this.relative_offset.x;
        const current_bb_top = this.bb.top_left.y + this.relative_offset.y;
        const current_bb_bottom = this.bb.bottom_right.y + this.relative_offset.y;

        const overlap = { x: 0, y: 0 };

        // Check for overlap on x-axis (left and right boundaries)
        if (current_bb_left < env_bb.left) {
            overlap.x = env_bb.left - current_bb_left;
        } else if (current_bb_right > env_bb.right) {
            overlap.x = env_bb.right - current_bb_right;
        }

        // Check for overlap on y-axis (top and bottom boundaries)
        if (current_bb_top < env_bb.top) {
            overlap.y = env_bb.top - current_bb_top;
        } else if (current_bb_bottom > env_bb.bottom) {
            overlap.y = env_bb.bottom - current_bb_bottom;
        }

        // Adjust relative_offset and reset velocity and force components
        if (overlap.x !== 0) {
            this.relative_offset.x += overlap.x;
            this.velocity.x = 0;
            this.force.x = 0;
        }

        if (overlap.y !== 0) {
            this.relative_offset.y += overlap.y;
            this.velocity.y = 0;
            this.force.y = 0;
        }
    }

    check_hull_collision(other_hull) {
        /*
            Check if this hull collides with the other hull using SAT.
            If a collision is detected, find the smallest vector to move both hulls apart.
        */

        // Gather potential separating axes
        const axes = this.get_normals().concat(other_hull.get_normals());
        let min_overlap = Infinity;
        let mtv_axis = null;

        for (const axis of axes) {
            // Project both hulls onto the axis
            const projection1 = this.project_onto_axis(axis);
            const projection2 = other_hull.project_onto_axis(axis);

            // Calculate overlap
            const overlap = Math.min(projection1.max, projection2.max) - Math.max(projection1.min, projection2.min);
            if (overlap <= 0) {
                // Separating axis found, no collision
                return; // Exit the method
            } else {
                if (overlap < min_overlap) {
                    min_overlap = overlap;
                    mtv_axis = axis;
                }
            }
        }

        // Collision detected
        // Determine the direction to move along the MTV axis
        const d = other_hull.relative_offset.subtract(this.relative_offset);
        if (d.dot(mtv_axis) < 0) {
            mtv_axis = mtv_axis.scale(-1);
        }

        // Minimum Translation Vector (MTV)
        const mtv = mtv_axis.scale(min_overlap);

        // Adjust positions to resolve collision
        this.relative_offset = this.relative_offset.subtract(mtv.scale(0.5));
        other_hull.relative_offset = other_hull.relative_offset.add(mtv.scale(0.5));

        // Adjust velocities to prevent re-collision
        const collision_normal = mtv_axis.normalize();
        const v1_normal = collision_normal.scale(this.velocity.dot(collision_normal));
        const v2_normal = collision_normal.scale(other_hull.velocity.dot(collision_normal));

        this.velocity = this.velocity.subtract(v1_normal);
        other_hull.velocity = other_hull.velocity.subtract(v2_normal);
    }

    // Get edges of the hull as pairs of points
    get_edges() {
        const adjusted_hull = this.get_adjusted_hull();
        const edges = [];
        for (let i = 0; i < adjusted_hull.length; i++) {
            const p1 = adjusted_hull[i];
            const p2 = adjusted_hull[(i + 1) % adjusted_hull.length];
            edges.push([p1, p2]);
        }
        return edges;
    }

    // Get normals of the edges (outward-facing)
    get_normals() {
        const edges = this.get_edges();
        return edges.map(([p1, p2]) => {
            const edge = p2.subtract(p1);
            const normal = new Vector(-edge.y, edge.x).normalize(); // Perpendicular to the edge
            return normal;
        });
    }

    // Project the hull onto an axis
    project_onto_axis(axis) {
        const adjusted_hull = this.get_adjusted_hull();
        let min = Infinity;
        let max = -Infinity;
        for (const point of adjusted_hull) {
            const projection = point.dot(axis);
            if (projection < min) min = projection;
            if (projection > max) max = projection;
        }
        return { min, max };
    }
}
