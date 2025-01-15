import {
    Vector,
    Matrix,
    Ray,
    ZERO,
    UP
} from "./classes.js";
import EPS from "./eps.js";

function distance_from_line_segment(endpoints, vec) {
    return closest_vec_on_line_segment(endpoints, vec).distance(vec);
}

function closest_vec_on_line_segment(endpoints, vec) {
    const [vec1, vec2] = endpoints;

    const vec1ToVec = vec.subtract(vec1);
    const vec1ToVec2 = vec2.subtract(vec1);
    const lineSegmentLength = vec1ToVec2.length();

    if (lineSegmentLength < EPS.FINE){
      return vec1.add(vec2).scale(0.5);
    }

    // Calculate the projection of vec1ToVec onto vec1ToVec2
    const projection =
        vec1ToVec.dot(vec1ToVec2) / (lineSegmentLength * lineSegmentLength);

    if (projection < 0) {
        // Closest to vec1
        return vec1;
    } else if (projection > 1) {
        return vec2;
    } else {
        // Perpendicular distance to the line segment
        const closestPoint = new Vector(
            vec1.x + projection * vec1ToVec2.x,
            vec1.y + projection * vec1ToVec2.y
        );
        return closestPoint;
    }
}

function line_segments_intersect(l1, l2) {
    const [p, r] = [l1[0], l1[1].subtract(l1[0])];
    const [q, s] = [l2[0], l2[1].subtract(l2[0])];

    const rxs = r.cross(s);
    const qmp = q.subtract(p);
    const t = qmp.cross(s) / rxs;
    const u = qmp.cross(r) / rxs;

    if (rxs === 0) {
        return [false, null];
    }

    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
        const intersection = p.add(r.scale(t));
        return [true, intersection];
    }

    return [false, null];
}

function matrix_from_input_output(f_in, f_out) {
    // Expect Col Vectors
    // f_in  = [vec1, vec2]
    // f_out = [A*vec1, A*vec2]
    // returns A

    const inp_matrix = new Matrix(f_in[0], f_in[1]);
    const out_matrix = new Matrix(f_out[0], f_out[1]);

    return out_matrix.mult(inp_matrix.invert());
}

function affine_transform_from_input_output(f_in, f_out) {
    // f_in --- f ---> f_out
    // f_in  = [vec1, vec2]
    // f_out = [f(vec1), f(vec2)]

    // Assumes A is (Uniform-Stretch) + Rotation
    // f(x) = Ax + b
    const A_inp1 = f_in[0].subtract(f_in[1]);
    const A_out1 = f_out[0].subtract(f_out[1]);

    const A_inp2 = A_inp1.get_orthogonal();
    const A_out2 = A_out1.get_orthogonal();

    const A = matrix_from_input_output([A_inp1, A_inp2], [A_out1, A_out2]);
    const b = f_out[0].subtract(A.mult(f_in[0])); // f(x) - Ax;

    return (vec) => {
        return A.mult(vec).add(b);
    };
}

function orthogonal_transform_from_input_output(v1, v2) {
    // v1 gets rotated and stretched to v2
    return affine_transform_from_input_output(
        [new Vector(0, 0), v1],
        [new Vector(0, 0), v2]
    );
}

function rotation_fun(rotation_vec, angle) {
    // Returns function that takes in a vector and rotates it `angle` around rotation_vec
    const rotMatrix = new Matrix(
        new Vector(Math.cos(angle), Math.sin(angle)),
        new Vector(-1 * Math.sin(angle), Math.cos(angle))
    );
    return (v) => {
        return rotMatrix.mult(v.subtract(rotation_vec)).add(rotation_vec);
    };
}

function vec_angle(vec1, vec2, reference = ZERO) {
    vec1 = vec1.subtract(reference);
    vec2 = vec2.subtract(reference);

    const dotProduct = vec1.dot(vec2);
    const lengthsProduct = vec1.length() * vec2.length();

    const cosineTheta = Math.max(-1, Math.min(1, dotProduct / lengthsProduct));
    const angle = Math.acos(cosineTheta);

    return angle || 0;
}

function vec_angle_clockwise(vec1, vec2, reference = ZERO, offset_range = false){
    if (typeof reference == "boolean"){
        offset_range = reference;
        reference = ZERO;
    }

    vec1 = vec1.subtract(reference);
    vec2 = vec2.subtract(reference);

    const dot = vec1.dot(vec2);
    const cross = vec1.x * vec2.y - vec1.y * vec2.x; // 2D cross product
    let angle = Math.acos(dot / (vec1.length() * vec2.length()));

    if (isNaN(angle)){
        return Math.PI;
    }

    if (cross < 0) {
        angle = 2 * Math.PI - angle; // Clockwise angle adjustment
    }

    if (angle > Math.PI && !offset_range) angle = angle - 2 * Math.PI

    return angle;
}

function orientation(vec1, vec2, vec3){
    const a = vec_angle_clockwise(vec1, vec2, vec3);
    assert(a !== 0 && a !== 180 && a !== -180, "Vectors are colinear");
    return a > 0 ? 1 : -1;
}

function bounding_box(points){
    let _min_x = Infinity;
    let _min_y = Infinity;
    let _max_x = - Infinity;
    let _max_y = - Infinity;

    points.forEach(p => {
        _min_x = Math.min(p.x, _min_x);
        _max_x = Math.max(p.x, _max_x);
        _min_y = Math.min(p.y, _min_y);
        _max_y = Math.max(p.y, _max_y);
    });

    return {
        width:  points.length == 0 ? 0 : _max_x - _min_x,
        height: points.length == 0 ? 0 : _max_y - _min_y,
        top_left: points.length == 0 ? ZERO : new Vector(_min_x, _min_y),
        top_right: points.length == 0 ? ZERO : new Vector(_max_x, _min_y),
        bottom_left:  points.length == 0 ? ZERO : new Vector(_min_x, _max_y),
        bottom_right: points.length == 0 ? ZERO : new Vector(_max_x, _max_y),
        left: _min_x,
        right: _max_x,
        top: _min_y,
        bottom: _max_y
    }
}

function convex_hull(points) {
    if (points.length <= 1) return points;

    // Sort points lexicographically by x, then by y
    points.sort((a, b) => a.x === b.x ? a.y - b.y : a.x - b.x);

    const lower = [];
    for (const p of points) {
        while (lower.length >= 2 && lower[lower.length - 2].subtract(lower[lower.length - 1]).cross(p.subtract(lower[lower.length - 1])) <= 0) {
            lower.pop();
        }
        lower.push(p);
    }

    const upper = [];
    for (let i = points.length - 1; i >= 0; i--) {
        const p = points[i];
        while (upper.length >= 2 && upper[upper.length - 2].subtract(upper[upper.length - 1]).cross(p.subtract(upper[upper.length - 1])) <= 0) {
            upper.pop();
        }
        upper.push(p);
    }

    // Remove the last point of each half because it's repeated at the beginning of the other half
    upper.pop();
    lower.pop();

    // Concatenate lower and upper hulls
    return lower.concat(upper);
}

function random_vec(){
    // Returns a uniformly random unit length vec
    const r1 = Math.random() * 2 * Math.PI;
    return UP.rotate(r1);
}

function polygon_contains_point(polygon_points, point){
    // On the edge is seen as not inside.
    let ray = new Ray(point, UP);
    if (polygon_points.length < 2) throw new Error("Polygon has to few points!");
    while (polygon_points.some(p => ray.contains(p))){
        ray = new Ray(point, random_vec());
    }

    let ctr = 0;
    for (let i = 0; i < polygon_points.length; i++){
        if (ray.intersect([polygon_points[i], polygon_points[ (i + 1) % polygon_points.length ]])){
            ctr++;
        }
    }

    return ctr % 2 == 1;
}

function deg_to_rad(d) {
    return (Math.PI * d) / 180;
}

function rad_to_deg(r) {
    return (180 / Math.PI) * r;
}

export {
    affine_transform_from_input_output,
    orthogonal_transform_from_input_output,
    closest_vec_on_line_segment,
    distance_from_line_segment,
    convex_hull,
    bounding_box,
    deg_to_rad,
    rad_to_deg,
    vec_angle,
    vec_angle_clockwise,
    rotation_fun,
    line_segments_intersect,
    random_vec,
    polygon_contains_point,
    orientation
};
