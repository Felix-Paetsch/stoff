// This was entirely AI generated. Not sure it works as we want.

use crate::coords as co;
use crate::utils::vecf64_to_linestring;
use geo::algorithm::line_intersection::{LineIntersection, line_intersection};
use geo::{Coord, Line};
use rstar::{AABB, RTree, RTreeObject};
use wasm_bindgen::prelude::*;

#[derive(Clone, Debug)]
struct Intersection {
    vec: Coord,
    index_l1: usize,
    frac_l1: f64,
    index_l2: usize,
    frac_l2: f64,
}

#[derive(Clone, Copy, Debug)]
struct IndexedSegment {
    index: usize,
    line: Line,
}

impl IndexedSegment {
    fn envelope_with_pad(&self) -> AABB<[f64; 2]> {
        let min_x = self.line.start.x.min(self.line.end.x);
        let min_y = self.line.start.y.min(self.line.end.y);
        let max_x = self.line.start.x.max(self.line.end.x);
        let max_y = self.line.start.y.max(self.line.end.y);

        let pad = co::scaled_epsilon(co::segment_scale(self.line.start, self.line.end));

        AABB::from_corners([min_x - pad, min_y - pad], [max_x + pad, max_y + pad])
    }
}

impl RTreeObject for IndexedSegment {
    type Envelope = AABB<[f64; 2]>;

    fn envelope(&self) -> Self::Envelope {
        self.envelope_with_pad()
    }
}

#[wasm_bindgen]
pub fn intersect(coords1: &[f64], coords2: &[f64]) -> Option<Vec<f64>> {
    let line1 = vecf64_to_linestring(coords1)?;
    let line2 = vecf64_to_linestring(coords2)?;

    let segs1: Vec<IndexedSegment> = line1
        .lines()
        .enumerate()
        .map(|(index, line)| IndexedSegment { index, line })
        .collect();

    let segs2: Vec<IndexedSegment> = line2
        .lines()
        .enumerate()
        .map(|(index, line)| IndexedSegment { index, line })
        .collect();

    if segs1.is_empty() || segs2.is_empty() {
        return None;
    }

    let tree2 = RTree::bulk_load(segs2);

    let mut intersections: Vec<Intersection> = Vec::new();

    for seg1 in segs1 {
        let env = seg1.envelope_with_pad();

        for seg2 in tree2.locate_in_envelope_intersecting(&env) {
            for mut hit in segment_intersections(seg1.line, seg2.line) {
                hit.index_l1 = seg1.index;
                hit.index_l2 = seg2.index;
                push_unique_intersection(&mut intersections, hit);
            }
        }
    }

    if intersections.is_empty() {
        None
    } else {
        Some(flatten_intersections(&intersections))
    }
}

fn flatten_intersections(intersections: &[Intersection]) -> Vec<f64> {
    let mut out = Vec::with_capacity(intersections.len() * 6);

    for i in intersections {
        out.push(i.vec.x);
        out.push(i.vec.y);
        out.push(i.index_l1 as f64);
        out.push(i.frac_l1);
        out.push(i.index_l2 as f64);
        out.push(i.frac_l2);
    }

    out
}

fn push_unique_intersection(out: &mut Vec<Intersection>, candidate: Intersection) {
    for existing in out.iter_mut() {
        if co::same_coord(existing.vec, candidate.vec) {
            let candidate_score = score_intersection(&candidate);
            let existing_score = score_intersection(existing);

            if candidate_score > existing_score
                || (candidate_score == existing_score && tie_break_better(&candidate, existing))
            {
                *existing = candidate;
            }
            return;
        }
    }

    out.push(candidate);
}

fn score_intersection(i: &Intersection) -> i32 {
    interior_score(i.frac_l1) + interior_score(i.frac_l2)
}

fn interior_score(t: f64) -> i32 {
    let eps = co::scaled_epsilon(1.0);
    if co::approx_eq(t, 0.0, 1.0) || co::approx_eq(t, 1.0, 1.0 + eps) {
        0
    } else {
        1
    }
}

fn tie_break_better(a: &Intersection, b: &Intersection) -> bool {
    (
        a.index_l1,
        a.index_l2,
        frac_key(a.frac_l1),
        frac_key(a.frac_l2),
    ) < (
        b.index_l1,
        b.index_l2,
        frac_key(b.frac_l1),
        frac_key(b.frac_l2),
    )
}

fn frac_key(t: f64) -> i64 {
    (t * 1_000_000_000.0).round() as i64
}

fn point_fraction_on_segment(pt: Coord, seg: Line) -> Option<f64> {
    let d = co::subtract(seg.end, seg.start);
    let v = co::subtract(pt, seg.start);
    let len2 = co::length_squared(d);
    let scale = co::segment_scale(seg.start, seg.end);
    let eps = co::scaled_epsilon(scale);

    if len2 <= eps * eps {
        return if co::same_coord(pt, seg.start) {
            Some(0.0)
        } else {
            None
        };
    }

    let line_tol = eps * (1.0 + co::length_squared(d));
    if co::cross(d, v).abs() > line_tol {
        return None;
    }

    let t = co::dot(v, d) / len2;
    co::clamp01_with_eps(t, eps)
}

fn make_intersection(pt: Coord, seg1: Line, seg2: Line) -> Option<Intersection> {
    let frac_l1 = point_fraction_on_segment(pt, seg1)?;
    let frac_l2 = point_fraction_on_segment(pt, seg2)?;

    Some(Intersection {
        vec: pt,
        index_l1: 0,
        frac_l1,
        index_l2: 0,
        frac_l2,
    })
}

fn segment_intersections(seg1: Line, seg2: Line) -> Vec<Intersection> {
    let d1 = co::subtract(seg1.end, seg1.start);
    let d2 = co::subtract(seg2.end, seg2.start);

    let eps1 = co::scaled_epsilon(co::segment_scale(seg1.start, seg1.end));
    let eps2 = co::scaled_epsilon(co::segment_scale(seg2.start, seg2.end));

    let seg1_is_point = co::length_squared(d1) <= eps1 * eps1;
    let seg2_is_point = co::length_squared(d2) <= eps2 * eps2;

    if seg1_is_point && seg2_is_point {
        if co::same_coord(seg1.start, seg2.start) {
            return vec![Intersection {
                vec: co::midpoint(seg1.start, seg2.start),
                index_l1: 0,
                frac_l1: 0.0,
                index_l2: 0,
                frac_l2: 0.0,
            }];
        }
        return vec![];
    }

    if seg1_is_point {
        if let Some(frac_l2) = point_fraction_on_segment(seg1.start, seg2) {
            return vec![Intersection {
                vec: seg1.start,
                index_l1: 0,
                frac_l1: 0.0,
                index_l2: 0,
                frac_l2,
            }];
        }
        return vec![];
    }

    if seg2_is_point {
        if let Some(frac_l1) = point_fraction_on_segment(seg2.start, seg1) {
            return vec![Intersection {
                vec: seg2.start,
                index_l1: 0,
                frac_l1,
                index_l2: 0,
                frac_l2: 0.0,
            }];
        }
        return vec![];
    }

    match line_intersection(seg1, seg2) {
        Some(LineIntersection::SinglePoint { intersection, .. }) => {
            make_intersection(intersection, seg1, seg2)
                .into_iter()
                .collect()
        }
        Some(LineIntersection::Collinear { intersection }) => {
            let mid = co::midpoint(intersection.start, intersection.end);
            make_intersection(mid, seg1, seg2).into_iter().collect()
        }
        None => {
            if let Some(hit) = fallback_near_parallel_intersection(seg1, seg2) {
                vec![hit]
            } else {
                vec![]
            }
        }
    }
}

fn fallback_near_parallel_intersection(seg1: Line, seg2: Line) -> Option<Intersection> {
    let candidates = [
        seg1.start,
        seg1.end,
        seg2.start,
        seg2.end,
        co::midpoint(seg1.start, seg1.end),
        co::midpoint(seg2.start, seg2.end),
    ];

    for pt in candidates {
        if point_fraction_on_segment(pt, seg1).is_some()
            && point_fraction_on_segment(pt, seg2).is_some()
        {
            return make_intersection(pt, seg1, seg2);
        }
    }

    overlap_midpoint_if_collinearish(seg1, seg2).and_then(|pt| make_intersection(pt, seg1, seg2))
}

fn overlap_midpoint_if_collinearish(seg1: Line, seg2: Line) -> Option<Coord> {
    let d1 = co::subtract(seg1.end, seg1.start);
    let len1 = co::length(d1);
    let scale =
        co::segment_scale(seg1.start, seg1.end).max(co::segment_scale(seg2.start, seg2.end));
    let eps = co::scaled_epsilon(scale);

    if len1 <= eps {
        return None;
    }

    let off1 = co::cross(d1, co::subtract(seg2.start, seg1.start)).abs();
    let off2 = co::cross(d1, co::subtract(seg2.end, seg1.start)).abs();
    let col_tol = eps * (1.0 + len1);

    if off1 > col_tol || off2 > col_tol {
        return None;
    }

    let len12 = co::length(d1);
    if len12 <= eps * eps {
        return None;
    }

    let t0 = co::dot(co::subtract(seg2.start, seg1.start), d1) / len12;
    let t1 = co::dot(co::subtract(seg2.end, seg1.start), d1) / len12;

    let a = t0.min(t1);
    let b = t0.max(t1);

    let lo = a.max(0.0);
    let hi = b.min(1.0);

    if hi + eps < lo {
        return None;
    }

    let mid_t = 0.5 * (lo + hi);
    Some(co::add(seg1.start, co::scale(d1, mid_t)))
}
