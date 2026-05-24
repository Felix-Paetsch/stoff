use crate::{
    geometry::{LineSegment, Vector},
    numerics::eps::{clamp01_with_eps, scaled_epsilon},
};

pub struct ClosestPointOnLinesegmentResult {
    pub fraction: f64,
    pub vector: Vector,
    pub distance: f64,
}

pub fn closest_point_on_linesegment(ls: LineSegment, p: Vector) -> ClosestPointOnLinesegmentResult {
    let seg = ls.end.subtract(ls.start);
    let seg_len2 = seg.length_squared();

    let scale = ls.segment_scale();
    let eps = scaled_epsilon(scale);

    if seg_len2 <= eps * eps {
        return ClosestPointOnLinesegmentResult {
            fraction: 0.0,
            vector: ls.start,
            distance: p.distance(ls.start),
        };
    }

    let proj = ls.project(p);
    let t = clamp01_with_eps(proj.fraction, eps).unwrap_or({
        if proj.fraction > 1.0 {
            1.0
        } else {
            0.0
        }
    });

    let v = ls.lerp(t);
    let distance = p.distance(v);

    ClosestPointOnLinesegmentResult {
        fraction: t,
        vector: v,
        distance,
    }
}
