use std::cmp::Ordering;

use crate::{
    geometry::{line_segment::LineSegment, shape::Shape, vertex::Vertex},
    numerics::eps::{clamp01_with_eps, scaled_epsilon},
};

#[derive(Clone, Copy, Debug)]
pub struct ShapePosition {
    pub vec: Vertex,
    pub index: usize,
    pub frac: f64,
}

impl PartialEq for ShapePosition {
    fn eq(&self, other: &Self) -> bool {
        self.index == other.index && self.frac == other.frac
    }
}

impl Eq for ShapePosition {}

impl PartialOrd for ShapePosition {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for ShapePosition {
    fn cmp(&self, other: &Self) -> Ordering {
        match self.index.cmp(&other.index) {
            Ordering::Equal => self.frac.total_cmp(&other.frac),
            ord => ord,
        }
    }
}

pub fn closest_point_position_on_shape(point: Vertex, shape: &Shape) -> ShapePosition {
    let mut closest_position: Option<ShapePosition> = None;
    let mut closest_distance = f64::INFINITY;

    for (index, segment) in shape.lines().enumerate() {
        let proj = segment.project(point);

        if proj.distance < closest_distance {
            closest_distance = proj.distance;
            closest_position = Some(ShapePosition {
                vec: proj.vertex,
                index,
                frac: proj.fraction,
            });
        }
    }

    closest_position.unwrap()
}

pub fn closest_shape_positions(shape1: &Shape, shape2: &Shape) -> [ShapePosition; 2] {
    let mut min_distance = f64::INFINITY;
    let mut closest_p1: Option<ShapePosition> = None;
    let mut closest_p2: Option<ShapePosition> = None;

    for (line1_index, segment1) in shape1.lines().enumerate() {
        for (line2_index, segment2) in shape2.lines().enumerate() {
            let res = closest_line_segment_points(&segment1, &segment2);

            if res.distance < min_distance {
                min_distance = res.distance;

                closest_p1 = Some(ShapePosition {
                    vec: res.v1,
                    index: line1_index,
                    frac: res.frac1,
                });

                closest_p2 = Some(ShapePosition {
                    vec: res.v2,
                    index: line2_index,
                    frac: res.frac2,
                });
            }
        }
    }

    match (closest_p1, closest_p2) {
        (Some(p1), Some(p2)) => [p1, p2],
        _ => unreachable!(),
    }
}

struct ClosestLineSegmentPoints {
    pub frac1: f64,
    pub v1: Vertex,
    pub frac2: f64,
    pub v2: Vertex,
    pub distance: f64,
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
                let v1 = Vertex::lerp(l1.start, l1.end, t);
                let v2 = Vertex::lerp(l2.start, l2.end, u);
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
