use crate::{
    LineSegment, Vector,
    epsilon::{EPS_ABS, clamp01_with_eps, scaled_epsilon},
};

impl LineSegment {
    pub fn intersection(a: &LineSegment, b: &LineSegment) -> Option<Vector> {
        let r = a.end - a.start;
        let s = b.end - b.start;

        let eps = EPS_ABS;

        let a_is_point = r.length_squared() <= eps * eps;
        let b_is_point = s.length_squared() <= eps * eps;

        match (a_is_point, b_is_point) {
            (true, true) => {
                let p = a.midpoint();
                let q = b.midpoint();
                if p.distance(q) <= eps { Some(p) } else { None }
            }
            (true, false) => {
                let p = a.midpoint();
                point_fraction_on_segment(p, b).map(|_| p)
            }
            (false, true) => {
                let p = b.midpoint();
                point_fraction_on_segment(p, a).map(|_| p)
            }
            (false, false) => segment_segment_intersection(a, b, eps),
        }
    }
}

pub fn point_fraction_on_segment(pt: Vector, seg: &LineSegment) -> Option<f64> {
    let d = seg.end - seg.start;
    let v = pt - seg.start;

    let scale = seg.segment_scale();
    let eps = scaled_epsilon(scale);
    let len2 = d.length_squared();

    if len2 <= eps * eps {
        return if pt.distance(seg.start) <= eps {
            Some(0.0)
        } else {
            None
        };
    }

    let len = len2.sqrt();
    let line_tol = eps * len;

    if d.cross(v).abs() > line_tol {
        return None;
    }

    let t = v.dot(d) / len2;
    clamp01_with_eps(t, eps)
}

fn segment_segment_intersection(a: &LineSegment, b: &LineSegment, eps: f64) -> Option<Vector> {
    let p = a.start;
    let q = b.start;
    let r = a.end - a.start;
    let s = b.end - b.start;
    let qmp = q - p;

    let rxs = r.cross(s);

    if rxs.abs() > eps {
        let t = clamp01_with_eps(qmp.cross(s) / rxs, eps)?;
        let u = clamp01_with_eps(qmp.cross(r) / rxs, eps)?;

        if !(0.0..=1.0).contains(&t) || !(0.0..=1.0).contains(&u) {
            return None;
        }

        return Some(p + r * t);
    }

    let col_tol = eps * r.length_squared().sqrt();
    if qmp.cross(r).abs() > col_tol {
        return None;
    }

    collinear_overlap_midpoint(a, b, eps)
}

fn collinear_overlap_midpoint(a: &LineSegment, b: &LineSegment, eps: f64) -> Option<Vector> {
    let d = a.end - a.start;
    let len2 = d.length_squared();

    if len2 <= eps * eps {
        return None;
    }

    let t0 = (b.start - a.start).dot(d) / len2;
    let t1 = (b.end - a.start).dot(d) / len2;

    let lo = t0.min(t1).max(0.0);
    let hi = t0.max(t1).min(1.0);

    if hi + eps < lo {
        return None;
    }

    let mid_t = 0.5 * (lo + hi);
    Some(a.start + d * mid_t)
}
