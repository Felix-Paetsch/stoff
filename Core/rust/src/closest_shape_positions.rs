use crate::utils::vecf64_to_linestring;
use geo::{Coord, Line};
use wasm_bindgen::prelude::*;

struct ShapePosition {
    vec: Coord,
    index: usize,
    frac: f64,
}

#[wasm_bindgen]
pub fn closest_points(coords1: &[f64], coords2: &[f64]) -> Option<Vec<f64>> {
    // Expects as input polygon points
    // The result has form:
    //
    // undefined/null OR
    //
    // shape1_vector_x
    // shape1_vector_y
    // shape1_index
    // shape1_fraction
    // ...... same for shape 2 ...

    let line1 = vecf64_to_linestring(coords1)?;
    let line2 = vecf64_to_linestring(coords2)?;

    // Find closest point on line2 to any point on line1
    let mut min_distance = f64::INFINITY;
    let mut closest_p1: Option<ShapePosition> = None;
    let mut closest_p2: Option<ShapePosition> = None;

    for (line1_index, segment1) in line1.lines().enumerate() {
        for (line2_index, segment2) in line2.lines().enumerate() {
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

struct ClosestLineSegmentPoints {
    frac1: f64,
    coord1: Coord,
    frac2: f64,
    coord2: Coord,
    distance: f64,
}

fn dot(a: Coord, b: Coord) -> f64 {
    a.x * b.x + a.y * b.y
}

fn closest_line_segment_points(l1: Line, l2: Line) -> ClosestLineSegmentPoints {
    let p = l1.start;
    let r = Coord {
        x: l1.end.x - l1.start.x,
        y: l1.end.y - l1.start.y,
    };

    let q = l2.start;
    let s = Coord {
        x: l2.end.x - l2.start.x,
        y: l2.end.y - l2.start.y,
    };

    let r_dot_r = dot(r, r);
    let s_dot_s = dot(s, s);
    let r_dot_s = dot(r, s);
    let qp = Coord {
        x: p.x - q.x,
        y: p.y - q.y,
    };
    let r_dot_qp = dot(r, qp);
    let s_dot_qp = dot(s, qp);

    let denom = r_dot_r * s_dot_s - r_dot_s * r_dot_s;

    let (mut t, mut u);

    if denom.abs() < 1e-12 {
        // Segments are parallel
        t = 0.0;
        u = if s_dot_s > 0.0 {
            (s_dot_qp / s_dot_s).clamp(0.0, 1.0)
        } else {
            0.0
        };
    } else {
        t = (r_dot_s * s_dot_qp - s_dot_s * r_dot_qp) / denom;
        u = (r_dot_r * s_dot_qp - r_dot_s * r_dot_qp) / denom;

        t = t.clamp(0.0, 1.0);
        u = u.clamp(0.0, 1.0);
    }

    let closest1 = Coord {
        x: p.x + t * r.x,
        y: p.y + t * r.y,
    };

    let closest2 = Coord {
        x: q.x + u * s.x,
        y: q.y + u * s.y,
    };

    let dx = closest1.x - closest2.x;
    let dy = closest1.y - closest2.y;
    let distance = (dx * dx + dy * dy).sqrt();

    ClosestLineSegmentPoints {
        frac1: t,
        coord1: closest1,
        frac2: u,
        coord2: closest2,
        distance,
    }
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
