use crate::coords as co;
use geo::algorithm::line_intersection::{line_intersection, LineIntersection};
use geo::{Coord, Line, LineString};
use rstar::{RTreeObject, AABB};

#[derive(Clone, Debug, Copy)]
pub(crate) struct Intersection {
    pub(crate) vec: Coord,
    pub(crate) index_l1: usize,
    pub(crate) frac_l1: f64,
    pub(crate) index_l2: usize,
    pub(crate) frac_l2: f64,
}

#[derive(Clone, Copy, Debug)]
pub(crate) struct IndexedSegment {
    pub(crate) index: usize,
    pub(crate) order: usize,
    pub(crate) line: Line,
    pub(crate) next_index: usize,
    pub(crate) next_order: usize,
    pub(crate) end_is_owned_by_next: bool,
}

#[derive(Clone, Copy, Debug)]
struct ShapePosition {
    index: usize,
    order: usize,
    frac: f64,
}

impl IndexedSegment {
    pub(crate) fn envelope_with_pad(&self) -> AABB<[f64; 2]> {
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

pub(crate) fn build_indexed_segments(line: &LineString, is_polygon: bool) -> Vec<IndexedSegment> {
    let mut coords = line.0.clone();

    if is_polygon && coords.len() >= 2 && co::same_coord(coords[0], coords[coords.len() - 1]) {
        coords.pop();
    }

    if coords.len() < 2 {
        return Vec::new();
    }

    let mut segments: Vec<IndexedSegment> = Vec::new();

    for index in 0..(coords.len() - 1) {
        let seg = Line::new(coords[index], coords[index + 1]);
        if !is_degenerate_segment(seg) {
            segments.push(IndexedSegment {
                index,
                order: segments.len(),
                line: seg,
                next_index: index,
                next_order: segments.len(),
                end_is_owned_by_next: false,
            });
        }
    }

    if is_polygon {
        let index = coords.len() - 1;
        let seg = Line::new(coords[coords.len() - 1], coords[0]);

        if !is_degenerate_segment(seg) {
            segments.push(IndexedSegment {
                index,
                order: segments.len(),
                line: seg,
                next_index: index,
                next_order: segments.len(),
                end_is_owned_by_next: false,
            });
        }
    }

    let len = segments.len();
    if len == 0 {
        return segments;
    }

    let indices: Vec<usize> = segments.iter().map(|s| s.index).collect();

    for (order, seg) in segments.iter_mut().enumerate() {
        if is_polygon || order + 1 < len {
            let next_order = if is_polygon {
                (order + 1) % len
            } else {
                order + 1
            };

            seg.next_order = next_order;
            seg.next_index = indices[next_order];
            seg.end_is_owned_by_next = true;
        } else {
            seg.next_order = order;
            seg.next_index = seg.index;
            seg.end_is_owned_by_next = false;
        }
    }

    segments
}

pub(crate) fn are_adjacent_by_order(
    a: &IndexedSegment,
    b: &IndexedSegment,
    is_polygon: bool,
    segment_count: usize,
) -> bool {
    if a.order == b.order {
        return true;
    }

    if a.order + 1 == b.order || b.order + 1 == a.order {
        return true;
    }

    is_polygon
        && segment_count >= 2
        && ((a.order == 0 && b.order + 1 == segment_count)
            || (b.order == 0 && a.order + 1 == segment_count))
}

pub(crate) fn flatten_intersections(intersections: &[Intersection]) -> Vec<f64> {
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

pub(crate) fn sort_intersections(intersections: &mut [Intersection]) {
    intersections.sort_by_key(|i| {
        (
            i.index_l1,
            frac_key(i.frac_l1),
            i.index_l2,
            frac_key(i.frac_l2),
            frac_key(i.vec.x),
            frac_key(i.vec.y),
        )
    });
}

pub(crate) fn push_unique_intersection(out: &mut Vec<Intersection>, candidate: Intersection) {
    for existing in out.iter() {
        if existing.index_l1 == candidate.index_l1
            && existing.index_l2 == candidate.index_l2
            && frac_key(existing.frac_l1) == frac_key(candidate.frac_l1)
            && frac_key(existing.frac_l2) == frac_key(candidate.frac_l2)
            && co::same_coord(existing.vec, candidate.vec)
        {
            return;
        }
    }

    out.push(candidate);
}

pub(crate) fn canonical_pair_intersection(
    raw: Intersection,
    seg1: &IndexedSegment,
    seg2: &IndexedSegment,
    same_shape: bool,
) -> Option<Intersection> {
    let pos1 = canonical_position(seg1, raw.frac_l1);
    let pos2 = canonical_position(seg2, raw.frac_l2);

    let mut out = Intersection {
        vec: raw.vec,
        index_l1: pos1.index,
        frac_l1: pos1.frac,
        index_l2: pos2.index,
        frac_l2: pos2.frac,
    };

    if same_shape && (pos2.order, frac_key(pos2.frac)) < (pos1.order, frac_key(pos1.frac)) {
        std::mem::swap(&mut out.index_l1, &mut out.index_l2);
        std::mem::swap(&mut out.frac_l1, &mut out.frac_l2);
    }

    if same_shape && out.index_l1 == out.index_l2 && frac_key(out.frac_l1) == frac_key(out.frac_l2)
    {
        return None;
    }

    Some(out)
}

fn canonical_position(seg: &IndexedSegment, frac: f64) -> ShapePosition {
    let eps = co::scaled_epsilon(1.0);

    if seg.end_is_owned_by_next && co::approx_eq(frac, 1.0, 1.0 + eps) {
        ShapePosition {
            index: seg.next_index,
            order: seg.next_order,
            frac: 0.0,
        }
    } else {
        ShapePosition {
            index: seg.index,
            order: seg.order,
            frac: normalize_frac(frac),
        }
    }
}

fn normalize_frac(t: f64) -> f64 {
    let eps = co::scaled_epsilon(1.0);

    if co::approx_eq(t, 0.0, 1.0) {
        0.0
    } else if co::approx_eq(t, 1.0, 1.0 + eps) {
        1.0
    } else {
        t
    }
}

pub(crate) fn frac_key(t: f64) -> i64 {
    (t * 1_000_000_000.0).round() as i64
}

pub(crate) fn is_degenerate_segment(seg: Line) -> bool {
    let d = co::subtract(seg.end, seg.start);
    let eps = co::scaled_epsilon(co::segment_scale(seg.start, seg.end));
    co::length_squared(d) <= eps * eps
}

pub(crate) fn point_fraction_on_segment(pt: Coord, seg: Line) -> Option<f64> {
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

pub(crate) fn segment_intersections(seg1: Line, seg2: Line) -> Vec<Intersection> {
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
        None => fallback_near_parallel_intersection(seg1, seg2)
            .into_iter()
            .collect(),
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

    let len1_sq = co::length_squared(d1);
    if len1_sq <= eps * eps {
        return None;
    }

    let t0 = co::dot(co::subtract(seg2.start, seg1.start), d1) / len1_sq;
    let t1 = co::dot(co::subtract(seg2.end, seg1.start), d1) / len1_sq;

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
