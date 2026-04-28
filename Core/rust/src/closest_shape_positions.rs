use crate::{
    coords::*,
    utils::{vecf64_to_generalized_line, GeneralizedLine},
};
use geo::{Coord, Line};
use wasm_bindgen::prelude::*;

struct ShapePosition {
    vec: Coord,
    index: usize,
    frac: f64,
}

#[wasm_bindgen]
pub fn closest_points(coords1: &[f64], coords2: &[f64]) -> Option<Vec<f64>> {
    // Expects as input polyline points
    // The result has form:
    //
    // undefined/null OR
    //
    // shape1_vector_x
    // shape1_vector_y
    // shape1_index
    // shape1_fraction
    // ...... same for shape 2 ...

    if coords2.len() == 2 && coords1.len() != 2 {
        let ret = closest_points(coords2, coords1);
        return ret.map(|v| vec![v[4], v[5], v[6], v[7], v[0], v[1], v[2], v[3]]);
    }

    let line1 = vecf64_to_generalized_line(coords1);
    let line2 = vecf64_to_generalized_line(coords2);

    if let GeneralizedLine::Point(p1) = line1 {
        match line2 {
            GeneralizedLine::Empty => {
                return None;
            }
            GeneralizedLine::Point(p2) => {
                return Some(create_return_value(
                    ShapePosition {
                        vec: p1.0,
                        index: 0,
                        frac: 0.0,
                    },
                    ShapePosition {
                        vec: p2.0,
                        index: 0,
                        frac: 0.0,
                    },
                ));
            }
            GeneralizedLine::Polyline(pl) => {
                let mut closest_coord2: Option<ShapePosition> = None;
                let mut closest_distance = f64::INFINITY;

                for (i, linesegment) in pl.lines().enumerate() {
                    let closest = closest_line_segment_points(
                        Line {
                            start: p1.0,
                            end: p1.0,
                        },
                        linesegment,
                    );

                    if closest.distance < closest_distance {
                        closest_distance = closest.distance;
                        closest_coord2 = Some(ShapePosition {
                            vec: closest.coord2,
                            index: i,
                            frac: closest.frac2,
                        })
                    }
                }

                return closest_coord2.map(|coord| {
                    create_return_value(
                        ShapePosition {
                            vec: p1.0,
                            index: 0,
                            frac: 0.0,
                        },
                        coord,
                    )
                });
            }
        }
    }

    let l1 = match line1 {
        GeneralizedLine::Polyline(pl) => pl,
        _ => panic!("Expected Point"),
    };
    let l2 = match line2 {
        GeneralizedLine::Polyline(pl) => pl,
        _ => panic!("Expected Point"),
    };

    // Find closest point on line2 to any point on line1
    let mut min_distance = f64::INFINITY;
    let mut closest_p1: Option<ShapePosition> = None;
    let mut closest_p2: Option<ShapePosition> = None;

    for (line1_index, segment1) in l1.lines().enumerate() {
        for (line2_index, segment2) in l2.lines().enumerate() {
            let res = closest_line_segment_points(segment1, segment2);
            if res.distance < min_distance {
                min_distance = res.distance;
                closest_p1 = Some(ShapePosition {
                    vec: res.coord1,
                    index: line1_index,
                    frac: res.frac1,
                });

                closest_p2 = Some(ShapePosition {
                    vec: res.coord2,
                    index: line2_index,
                    frac: res.frac2,
                });
            }
        }
    }

    match (closest_p1, closest_p2) {
        (Some(p1), Some(p2)) => Some(create_return_value(p1, p2)),
        _ => None,
    }
}

pub struct ClosestLineSegmentPoints {
    frac1: f64,
    coord1: Coord,
    frac2: f64,
    coord2: Coord,
    distance: f64,
}

fn point_at(a: Coord, dir: Coord, t: f64) -> Coord {
    add(a, scale(dir, t))
}

fn project_point_onto_segment(point: Coord, seg_start: Coord, seg_end: Coord) -> (f64, Coord, f64) {
    let seg = subtract(seg_end, seg_start);
    let seg_len2 = length_squared(seg);

    let seg_scale = segment_scale(seg_start, seg_end);
    let eps = scaled_epsilon(seg_scale);

    if seg_len2 <= eps * eps {
        let d = distance(point, seg_start);
        return (0.0, seg_start, d);
    }

    let t = dot(subtract(point, seg_start), seg) / seg_len2;
    let t = t.clamp(0.0, 1.0);
    let proj = point_at(seg_start, seg, t);
    let d = distance(point, proj);
    (t, proj, d)
}

pub fn closest_line_segment_points(l1: Line, l2: Line) -> ClosestLineSegmentPoints {
    let p = l1.start;
    let q = l2.start;
    let r = subtract(l1.end, l1.start);
    let s = subtract(l2.end, l2.start);

    let r_dot_r = length_squared(r);
    let s_dot_s = length_squared(s);

    let scale = segment_scale(l1.start, l1.end).max(segment_scale(l2.start, l2.end));
    let eps = scaled_epsilon(scale);

    let l1_degenerate = r_dot_r <= eps * eps;
    let l2_degenerate = s_dot_s <= eps * eps;

    if l1_degenerate && l2_degenerate {
        let d = distance(p, q);
        return ClosestLineSegmentPoints {
            frac1: 0.0,
            coord1: p,
            frac2: 0.0,
            coord2: q,
            distance: d,
        };
    }

    if l1_degenerate {
        let (u, coord2, d) = project_point_onto_segment(p, l2.start, l2.end);
        return ClosestLineSegmentPoints {
            frac1: 0.0,
            coord1: p,
            frac2: u,
            coord2,
            distance: d,
        };
    }

    if l2_degenerate {
        let (t, coord1, d) = project_point_onto_segment(q, l1.start, l1.end);
        return ClosestLineSegmentPoints {
            frac1: t,
            coord1,
            frac2: 0.0,
            coord2: q,
            distance: d,
        };
    }

    let r_dot_s = dot(r, s);
    let qp = subtract(p, q);
    let r_dot_qp = dot(r, qp);
    let s_dot_qp = dot(s, qp);

    let rxs = cross(r, s);

    if rxs.abs() > eps * scale {
        let denom = r_dot_r * s_dot_s - r_dot_s * r_dot_s;

        let t = (r_dot_s * s_dot_qp - s_dot_s * r_dot_qp) / denom;
        let u = (r_dot_r * s_dot_qp - r_dot_s * r_dot_qp) / denom;

        if let (Some(t), Some(u)) = (clamp01_with_eps(t, eps), clamp01_with_eps(u, eps)) {
            let coord1 = point_at(p, r, t);
            let coord2 = point_at(q, s, u);
            let d = distance(coord1, coord2);

            return ClosestLineSegmentPoints {
                frac1: t,
                coord1,
                frac2: u,
                coord2,
                distance: d,
            };
        }
    }

    let mut best = {
        let (u, coord2, d) = project_point_onto_segment(l1.start, l2.start, l2.end);
        ClosestLineSegmentPoints {
            frac1: 0.0,
            coord1: l1.start,
            frac2: u,
            coord2,
            distance: d,
        }
    };

    {
        let (u, coord2, d) = project_point_onto_segment(l1.end, l2.start, l2.end);
        if d < best.distance {
            best = ClosestLineSegmentPoints {
                frac1: 1.0,
                coord1: l1.end,
                frac2: u,
                coord2,
                distance: d,
            };
        }
    }

    {
        let (t, coord1, d) = project_point_onto_segment(l2.start, l1.start, l1.end);
        if d < best.distance {
            best = ClosestLineSegmentPoints {
                frac1: t,
                coord1,
                frac2: 0.0,
                coord2: l2.start,
                distance: d,
            };
        }
    }

    {
        let (t, coord1, d) = project_point_onto_segment(l2.end, l1.start, l1.end);
        if d < best.distance {
            best = ClosestLineSegmentPoints {
                frac1: t,
                coord1,
                frac2: 1.0,
                coord2: l2.end,
                distance: d,
            };
        }
    }

    best
}

fn create_return_value(s1: ShapePosition, s2: ShapePosition) -> Vec<f64> {
    vec![
        s1.vec.x,
        s1.vec.y,
        s1.index as f64,
        s1.frac,
        s2.vec.x,
        s2.vec.y,
        s2.index as f64,
        s2.frac,
    ]
}
