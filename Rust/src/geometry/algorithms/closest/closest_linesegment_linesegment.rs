use crate::{
    geometry::{
        algorithms::closest::closest_linesegment_point::closest_point_on_linesegment, LineSegment,
        Vector,
    },
    numerics::eps::{clamp01_with_eps, scaled_epsilon},
};

pub struct ClosestLineSegmentPoints {
    pub frac1: f64,
    pub v1: Vector,
    pub frac2: f64,
    pub v2: Vector,
    pub distance: f64,
}

pub fn closest_linesegment_points(l1: &LineSegment, l2: &LineSegment) -> ClosestLineSegmentPoints {
    let p = l1.start;
    let q = l2.start;
    let r = l1.end.subtract(l1.start);
    let s = l2.end.subtract(l2.start);

    let r_dot_r = r.length_squared();
    let s_dot_s = s.length_squared();

    let scale = l1.segment_scale().max(l2.segment_scale());
    let eps = scaled_epsilon(scale);

    let l1_degenerate = r_dot_r <= eps * eps;
    let l2_degenerate = s_dot_s <= eps * eps;

    if l1_degenerate && l2_degenerate {
        let d = p.distance(q);
        return ClosestLineSegmentPoints {
            frac1: 0.0,
            v1: p,
            frac2: 0.0,
            v2: q,
            distance: d,
        };
    }

    if l1_degenerate {
        let closest = closest_point_on_linesegment(*l2, p);
        return ClosestLineSegmentPoints {
            frac1: 0.0,
            v1: p,
            frac2: closest.fraction,
            v2: closest.vector,
            distance: closest.distance,
        };
    }

    if l2_degenerate {
        let closest = closest_point_on_linesegment(*l1, q);
        return ClosestLineSegmentPoints {
            frac1: closest.fraction,
            v1: closest.vector,
            frac2: 0.0,
            v2: q,
            distance: closest.distance,
        };
    }

    let r_dot_s = r.dot(s);
    let qp = q.subtract(p);
    let rxs = r.cross(s);

    if rxs.abs() > eps * scale {
        let denom = r_dot_r * s_dot_s - r_dot_s * r_dot_s;

        if denom.abs() > eps * eps {
            let t = qp.cross(s) / rxs;
            let u = qp.cross(r) / rxs;

            if let (Some(t), Some(u)) = (clamp01_with_eps(t, eps), clamp01_with_eps(u, eps)) {
                let v1 = Vector::lerp(l1.start, l1.end, t);
                let v2 = Vector::lerp(l2.start, l2.end, u);
                let d = v1.distance(v2);

                return ClosestLineSegmentPoints {
                    frac1: t,
                    v1,
                    frac2: u,
                    v2,
                    distance: d,
                };
            }
        }
    }

    let mut best = {
        let closest = closest_point_on_linesegment(*l2, l1.start);
        ClosestLineSegmentPoints {
            frac1: 0.0,
            v1: l1.start,
            frac2: closest.fraction,
            v2: closest.vector,
            distance: closest.distance,
        }
    };

    {
        let closest = closest_point_on_linesegment(*l2, l1.end);
        if closest.distance < best.distance {
            best = ClosestLineSegmentPoints {
                frac1: 1.0,
                v1: l1.end,
                frac2: closest.fraction,
                v2: closest.vector,
                distance: closest.distance,
            };
        }
    }

    {
        let closest = closest_point_on_linesegment(*l1, l2.start);
        if closest.distance < best.distance {
            best = ClosestLineSegmentPoints {
                frac1: closest.fraction,
                v1: closest.vector,
                frac2: 0.0,
                v2: l2.start,
                distance: closest.distance,
            };
        }
    }

    {
        let closest = closest_point_on_linesegment(*l1, l2.end);
        if closest.distance < best.distance {
            best = ClosestLineSegmentPoints {
                frac1: closest.fraction,
                v1: closest.vector,
                frac2: 1.0,
                v2: l2.end,
                distance: closest.distance,
            };
        }
    }

    best
}
