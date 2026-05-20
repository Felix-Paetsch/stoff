use crate::{
    geometry::{LineSegment, Shape, ShapePosition, ShapeT, Vector},
    numerics::eps::{clamp01_with_eps, scaled_epsilon},
};

pub fn closest_point_position_on_shape(
    point: Vector,
    shape: &impl ShapeT,
) -> Option<ShapePosition> {
    let mut closest_position: Option<ShapePosition> = None;
    let mut closest_distance = f64::INFINITY;

    for (index, segment) in shape.lines().into_iter().enumerate() {
        let proj = segment.project(point);

        if proj.distance < closest_distance {
            closest_distance = proj.distance;
            closest_position = Some(ShapePosition::new(index, proj.fraction, proj.vertex));
        }
    }

    closest_position
}

pub fn closest_shape_positions(shape1: &Shape, shape2: &Shape) -> [ShapePosition; 2] {
    let mut min_distance = f64::INFINITY;
    let mut closest_p1: Option<ShapePosition> = None;
    let mut closest_p2: Option<ShapePosition> = None;

    for (line1_index, segment1) in shape1.lines().into_iter().enumerate() {
        for (line2_index, segment2) in shape2.lines().into_iter().enumerate() {
            let res = closest_line_segment_points(&segment1, &segment2);

            if res.distance < min_distance {
                min_distance = res.distance;

                closest_p1 = Some(ShapePosition::new(line1_index, res.frac1, res.v1));
                closest_p2 = Some(ShapePosition::new(line2_index, res.frac2, res.v2));
            }
        }
    }

    match (closest_p1, closest_p2) {
        (Some(p1), Some(p2)) => [p1, p2],
        _ => unreachable!(),
    }
}

struct ClosestLineSegmentPoints {
    frac1: f64,
    v1: Vector,
    frac2: f64,
    v2: Vector,
    distance: f64,
}

fn closest_line_segment_points(l1: &LineSegment, l2: &LineSegment) -> ClosestLineSegmentPoints {
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
        let proj = l2.project(p);
        return ClosestLineSegmentPoints {
            frac1: 0.0,
            v1: p,
            frac2: proj.fraction,
            v2: proj.vertex,
            distance: proj.distance,
        };
    }

    if l2_degenerate {
        let proj = l1.project(q);
        return ClosestLineSegmentPoints {
            frac1: proj.fraction,
            v1: proj.vertex,
            frac2: 0.0,
            v2: q,
            distance: proj.distance,
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
        let proj = l2.project(l1.start);
        ClosestLineSegmentPoints {
            frac1: 0.0,
            v1: l1.start,
            frac2: proj.fraction,
            v2: proj.vertex,
            distance: proj.distance,
        }
    };

    {
        let proj = l2.project(l1.end);
        if proj.distance < best.distance {
            best = ClosestLineSegmentPoints {
                frac1: 1.0,
                v1: l1.end,
                frac2: proj.fraction,
                v2: proj.vertex,
                distance: proj.distance,
            };
        }
    }

    {
        let proj = l1.project(l2.start);
        if proj.distance < best.distance {
            best = ClosestLineSegmentPoints {
                frac1: proj.fraction,
                v1: proj.vertex,
                frac2: 0.0,
                v2: l2.start,
                distance: proj.distance,
            };
        }
    }

    {
        let proj = l1.project(l2.end);
        if proj.distance < best.distance {
            best = ClosestLineSegmentPoints {
                frac1: proj.fraction,
                v1: proj.vertex,
                frac2: 1.0,
                v2: l2.end,
                distance: proj.distance,
            };
        }
    }

    best
}
