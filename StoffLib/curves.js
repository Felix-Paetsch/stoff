import { assert } from "./dev/validation.js";

export function arc(fill_amt){
    return t => {
        return [
            Math.sin(-2 * Math.PI * fill_amt*t),
            Math.cos(-2 * Math.PI * fill_amt*t)
        ];
    }
}

export const spline = {
    bezier: (points) => {
        return bezier_spline(points, points.length - 1);
    },
    bezier_spline,
    bezier_smooth_cubic,
    hermite_spline,
    catmull_rom_spline
};


function bezier_spline(static_points, degree = 2){
    assert((static_points.length - 1) % degree === 0);
    assert(degree >= 1);

    const points = [...static_points];
    let segments = [];

    while (points.length > 1){
        const to_push = points.splice(0, degree);
        to_push.push(points[0]);
        segments.push(to_push);
    }

    // Return function that computes point on the path given t
    const res_fun = function (t) {
        // Determine which curve segment to use
        let segment_index = Math.floor(t * segments.length);
        let segment_t = t * segments.length - segment_index;

        if (t == 1){
            segment_index = segments.length - 1;
            segment_t = 1;
        }

        return bezier(
                segments[segment_index],
                segment_t
        ).to_array();
    };

    res_fun.points = static_points;
    res_fun.points_forEach = points_forEach.bind(res_fun);
    res_fun.plot_control_points = bezier_plot_control_points.bind(res_fun);

    return res_fun;
}

function bezier(points, t){
    assert(points.length > 0);
    if (points.length == 1) return points[0];
    return bezier(points.slice(0, points.length - 1), t).mult(1-t)
        .add(
            bezier(points.slice(1, points.length), t).mult(t)
        );
}

function hermite_spline(points, velocities, relative = false){
    // Returns a fn creating the hermite spline through the given poitns with the right velocity
    // relative means whether the velocity is given as a vector from (0, 0) or from the current control pt


    assert(points.length == velocities.length, "Number of points and velocities must be equal");

    let new_velocities = velocities;
    if (!relative){
        new_velocities = [];
        for (let i = 0; i < points.length; i++){
            new_velocities.push(velocities[i].subtract(points[i]));
        }
    }

    const hermite_control_points = [];
    const control_points = [];
    for (let i = 0; i < points.length - 1; i++){
        control_points.push(
            points[i],
            points[i].add(new_velocities[i].mult(1/3)),
            points[i + 1].subtract(new_velocities[i + 1].mult(1/3))
        );

        hermite_control_points.push(
            points[i],
            points[i].add(new_velocities[i])
        );
    }

    control_points.push(points[points.length - 1]);
    hermite_control_points.push(
        points[points.length - 1],
        points[points.length - 1].add(new_velocities[points.length - 1])
    );

    const res_fun = bezier_spline(control_points, 3);

    res_fun.points = hermite_control_points;
    res_fun.plot_control_points = hermite_plot_control_points.bind(res_fun);

    return res_fun;
}

function catmull_rom_spline(points, start_velocity = null, end_velocity = null, relative = false){
    assert(points.length > 1);

    if (start_velocity == null){
        start_velocity = points[1].subtract(points[0]);
    } else if (!relative){
        start_velocity = start_velocity.subtract(points[0]);
    }

    const velocities = [start_velocity];
    for (let i = 1; i < points.length- 1; i++){
        velocities.push(
            (points[i+1].subtract(points[i-1])).mult(1/2)
        );
    }

    if (end_velocity == null){
        end_velocity = points[points.length - 1].subtract(points[points.length - 2]);
    } else if (!relative){
        end_velocity = end_velocity.subtract(points[points.length - 1]);
    }

    velocities.push(end_velocity);
    return hermite_spline(points, velocities, true);
}

// Bezier/Hermite path utils
function points_forEach(vec_callback = (pt) => {}){
    // Note, that these are Vectors() not Points()
    this.points.forEach((vec, i) => vec_callback(vec, i));
    return this;
}

function bezier_plot_control_points(sketch, pt_callback = (pt) => {}){
    const pts = [];
    this.points.forEach((vec, i) => {
        const pt = sketch.add(vec.copy());
        pt.set_color("rgba(219, 165, 255,.5)");
        pts.push(pt);
        pt_callback(pt, i);
    });

    for (let i = 0; i < pts.length - 1; i ++){
        sketch.line_between_points(pts[i], pts[i+1]).set_color("rgba(0,100,0,.3)");
    }
    return this;
}

function hermite_plot_control_points(sketch, pt_callback = (pt) => {}){
    const pts = [];
    this.points.forEach((vec, i) => {
        const pt = sketch.add(vec.copy());
        pt.set_color("rgba(219, 165, 255,.5)");
        pts.push(pt);
        pt_callback(pt, i);
    });

    for (let i = 0; i < pts.length/2; i ++){
        sketch.line_between_points(pts[2*i], pts[2*i+1]).set_color("rgba(0,100,0,.3)");
    }
    return this;
}

// Build Up

function bezier_smooth_cubic(points, tangents, relative = false){
    assert(tangents.length == points.length, "We require same amt of points and tangents");

    const new_pts = [];
    if (relative){
        tangents = tangents.map((t, i) => points[i].add(t));
    }

    for (let i = 0; i < points.length - 1; i += 1) {
        new_pts.push(
            points[i],
            tangents[i],
            points[i+1].add(
                points[i+1].subtract(tangents[i+1])
            )
        );
    }

    new_pts.push(points[points.length - 1]);
    return bezier_spline(new_pts, 3);
}
