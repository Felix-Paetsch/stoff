use rstar::{RTreeObject, AABB};

use crate::geometry::{
    line_segment::LineSegment, polygon::Polygon, polyline::Polyline, shape::Shape, vertex::Vertex,
};
use crate::numerics::eps::{approx_eq, clamp01_with_eps, scaled_epsilon};

#[derive(Clone, Debug, Copy)]
pub struct Intersection {
    pub vec: Vertex,
    pub index_l1: usize,
    pub frac_l1: f64,
    pub index_l2: usize,
    pub frac_l2: f64,
}

#[derive(Debug, Clone, Copy)]
pub struct IndexedSegment {
    pub index: usize,
    pub order: usize,
    pub line: LineSegment,
    pub next_index: usize,
    pub next_order: usize,
    pub end_is_owned_by_next: bool,
}

#[derive(Clone, Copy, Debug)]
struct ShapePosition {
    index: usize,
    order: usize,
    frac: f64,
}

impl IndexedSegment {
    pub fn envelope_with_pad(&self) -> AABB<[f64; 2]> {
        let min_x = self.line.start.x.min(self.line.end.x);
        let min_y = self.line.start.y.min(self.line.end.y);
        let max_x = self.line.start.x.max(self.line.end.x);
        let max_y = self.line.start.y.max(self.line.end.y);

        let pad = scaled_epsilon(self.line.segment_scale());

        AABB::from_corners([min_x - pad, min_y - pad], [max_x + pad, max_y + pad])
    }
}

impl RTreeObject for IndexedSegment {
    type Envelope = AABB<[f64; 2]>;

    fn envelope(&self) -> Self::Envelope {
        self.envelope_with_pad()
    }
}

pub fn shape_is_polygon(shape: &Shape) -> bool {
    matches!(shape, Shape::Polygon(_))
}

pub fn build_indexed_segments(shape: &Shape) -> Vec<IndexedSegment> {
    let is_polygon = shape_is_polygon(shape);

    let mut segments: Vec<IndexedSegment> = shape
        .lines()
        .enumerate()
        .filter_map(|(index, seg)| {
            if is_degenerate_segment(&seg) {
                return None;
            }

            Some(IndexedSegment {
                index,
                order: 0,
                line: seg,
                next_index: index,
                next_order: index,
                end_is_owned_by_next: false,
            })
        })
        .collect();

    let len = segments.len();
    let indices: Vec<usize> = segments.iter().map(|s| s.index).collect();

    for (order, seg) in segments.iter_mut().enumerate() {
        let next_order = if is_polygon || order + 1 < len {
            (order + 1) % len.max(1)
        } else {
            order
        };

        seg.order = order;
        seg.next_order = next_order;
        seg.next_index = indices[next_order];
        seg.end_is_owned_by_next = is_polygon || order + 1 < len;
    }

    segments
}

pub fn build_indexed_segments_polyline(line: &Polyline) -> Vec<IndexedSegment> {
    build_indexed_segments(&Shape::Polyline(line.clone()))
}

pub fn build_indexed_segments_polygon(poly: &Polygon) -> Vec<IndexedSegment> {
    build_indexed_segments(&Shape::Polygon(poly.clone()))
}

pub fn are_adjacent_by_order(
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

pub fn flatten_intersections(intersections: &[Intersection]) -> Vec<f64> {
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

pub fn sort_intersections(intersections: &mut [Intersection]) {
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

pub fn push_unique_intersection(out: &mut Vec<Intersection>, candidate: Intersection) {
    for existing in out.iter() {
        if existing.index_l1 == candidate.index_l1
            && existing.index_l2 == candidate.index_l2
            && frac_key(existing.frac_l1) == frac_key(candidate.frac_l1)
            && frac_key(existing.frac_l2) == frac_key(candidate.frac_l2)
        {
            return;
        }
    }

    out.push(candidate);
}

pub fn canonical_pair_intersection(
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
    let eps = scaled_epsilon(1.0);

    if seg.end_is_owned_by_next && approx_eq(frac, 1.0, 1.0 + eps) {
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
    let eps = scaled_epsilon(1.0);

    if approx_eq(t, 0.0, 1.0) {
        0.0
    } else if approx_eq(t, 1.0, 1.0 + eps) {
        1.0
    } else {
        t
    }
}

pub fn frac_key(t: f64) -> i64 {
    (t * 1_000_000_000.0).round() as i64
}

pub fn is_degenerate_segment(seg: &LineSegment) -> bool {
    seg.start == seg.end
}

pub fn point_fraction_on_segment(pt: Vertex, seg: &LineSegment) -> Option<f64> {
    let d = seg.end.subtract(seg.start);
    let v = pt.subtract(seg.start);
    let len2 = d.length_squared();
    let scale = seg.segment_scale();
    let eps = scaled_epsilon(scale);

    if len2 <= eps * eps {
        return if pt.approx_equals(seg.start) {
            Some(0.0)
        } else {
            None
        };
    }

    let line_tol = eps * (1.0 + d.length_squared());
    if d.cross(v).abs() > line_tol {
        return None;
    }

    let t = v.dot(d) / len2;
    clamp01_with_eps(t, eps)
}

fn make_intersection(pt: Vertex, seg1: &LineSegment, seg2: &LineSegment) -> Option<Intersection> {
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

pub fn segment_intersections(seg1: &LineSegment, seg2: &LineSegment) -> Vec<Intersection> {
    let d1 = seg1.end.subtract(seg1.start);
    let d2 = seg2.end.subtract(seg2.start);

    let eps1 = scaled_epsilon(seg1.segment_scale());
    let eps2 = scaled_epsilon(seg2.segment_scale());

    let seg1_is_point = d1.length_squared() <= eps1 * eps1;
    let seg2_is_point = d2.length_squared() <= eps2 * eps2;

    if seg1_is_point && seg2_is_point {
        if seg1.start.approx_equals(seg2.start) {
            return vec![Intersection {
                vec: Vertex::lerp(seg1.start, seg2.start, 0.5),
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

    if let Some(hit) = proper_segment_intersection(seg1, seg2) {
        return vec![hit];
    }

    fallback_near_parallel_intersection(seg1, seg2)
        .into_iter()
        .collect()
}

fn proper_segment_intersection(seg1: &LineSegment, seg2: &LineSegment) -> Option<Intersection> {
    let p = seg1.start;
    let q = seg2.start;
    let r = seg1.end.subtract(seg1.start);
    let s = seg2.end.subtract(seg2.start);

    let scale = seg1.segment_scale().max(seg2.segment_scale());
    let eps = scaled_epsilon(scale);

    let rxs = r.cross(s);
    let qmp = q.subtract(p);
    let qmpxr = qmp.cross(r);

    if rxs.abs() <= eps {
        if qmpxr.abs() <= eps {
            let t0 = project_fraction(seg2.start, seg1)?;
            let t1 = project_fraction(seg2.end, seg1)?;

            let a = t0.min(t1);
            let b = t0.max(t1);

            let lo = a.max(0.0);
            let hi = b.min(1.0);

            if hi + eps < lo {
                return None;
            }

            let mid_t = 0.5 * (lo + hi);
            let pt = seg1.start.add(r.scale(mid_t));
            return make_intersection(pt, seg1, seg2);
        }

        return None;
    }

    let t = qmp.cross(s) / rxs;
    let t = clamp01_with_eps(t, eps)?;

    let pt = p.add(r.scale(t));
    make_intersection(pt, seg1, seg2)
}

fn project_fraction(pt: Vertex, seg: &LineSegment) -> Option<f64> {
    let d = seg.end.subtract(seg.start);
    let len2 = d.length_squared();

    if len2 == 0.0 {
        return None;
    }

    Some(pt.subtract(seg.start).dot(d) / len2)
}

fn fallback_near_parallel_intersection(
    seg1: &LineSegment,
    seg2: &LineSegment,
) -> Option<Intersection> {
    let candidates = [
        seg1.start,
        seg1.end,
        seg2.start,
        seg2.end,
        Vertex::lerp(seg1.start, seg1.end, 0.5),
        Vertex::lerp(seg2.start, seg2.end, 0.5),
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

fn overlap_midpoint_if_collinearish(seg1: &LineSegment, seg2: &LineSegment) -> Option<Vertex> {
    let d1 = seg1.end.subtract(seg1.start);
    let len1 = d1.length();
    let scale = seg1.segment_scale().max(seg2.segment_scale());
    let eps = scaled_epsilon(scale);

    if len1 <= eps {
        return None;
    }

    let off1 = d1.cross(seg2.start.subtract(seg1.start)).abs();
    let off2 = d1.cross(seg2.end.subtract(seg1.start)).abs();
    let col_tol = eps * (1.0 + len1);

    if off1 > col_tol || off2 > col_tol {
        return None;
    }

    let len1_sq = d1.length_squared();
    if len1_sq <= eps * eps {
        return None;
    }

    let t0 = seg2.start.subtract(seg1.start).dot(d1) / len1_sq;
    let t1 = seg2.end.subtract(seg1.start).dot(d1) / len1_sq;

    let a = t0.min(t1);
    let b = t0.max(t1);

    let lo = a.max(0.0);
    let hi = b.min(1.0);

    if hi + eps < lo {
        return None;
    }

    let mid_t = 0.5 * (lo + hi);
    Some(seg1.start.add(d1.scale(mid_t)))
}
