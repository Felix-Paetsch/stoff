use rstar::{RTreeObject, AABB};

use crate::geometry::{
    line_segment::LineSegment, shape_trait::ShapeT, shape_utils::shape_position::ShapePosition,
    vector::Vector,
};
use crate::numerics::eps::{approx_eq, clamp01_with_eps, scaled_epsilon};

pub type Intersection = [ShapePosition; 2];

#[derive(Debug, Clone, Copy)]
pub struct IndexedSegment {
    pub index: usize,
    pub line: LineSegment,
}

#[derive(Debug, Clone)]
pub struct ShapeProgressIndex {
    cumulative_lengths: Vec<f64>,
    total_length: f64,
    is_polygon: bool,
    segment_count: usize,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct ProgressKey(i64);

impl IndexedSegment {
    pub fn envelope_with_pad(&self) -> AABB<[f64; 2]> {
        let min_x = self.line.start.x().min(self.line.end.x());
        let min_y = self.line.start.y().min(self.line.end.y());
        let max_x = self.line.start.x().max(self.line.end.x());
        let max_y = self.line.start.y().max(self.line.end.y());

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

impl ShapeProgressIndex {
    pub fn new(shape: &impl ShapeT) -> Self {
        let lines = shape.lines();
        let mut cumulative_lengths = Vec::with_capacity(lines.len() + 1);
        let mut acc = 0.0;
        cumulative_lengths.push(acc);

        for seg in &lines {
            let len = seg.end.subtract(seg.start).length();
            acc += len;
            cumulative_lengths.push(acc);
        }

        Self {
            cumulative_lengths,
            total_length: acc,
            is_polygon: shape.is_polygon(),
            segment_count: lines.len(),
        }
    }

    pub fn progress_of(&self, pos: &ShapePosition) -> f64 {
        let idx = pos.index().min(self.segment_count);
        let base = self.cumulative_lengths[idx.min(self.segment_count)];

        if idx >= self.segment_count {
            return base;
        }

        let seg_len = self.cumulative_lengths[idx + 1] - self.cumulative_lengths[idx];
        let frac = normalize_frac(pos.frac());

        let p = base + frac * seg_len;

        if self.is_polygon && self.total_length > 0.0 && approx_eq(p, self.total_length, 1.0) {
            0.0
        } else {
            p
        }
    }

    pub fn key_of(&self, pos: &ShapePosition) -> ProgressKey {
        let p = self.progress_of(pos);
        let scale = self.total_length.max(1.0);
        let eps = scaled_epsilon(scale).max(1e-12);
        ProgressKey((p / eps).round() as i64)
    }
}

pub fn build_indexed_segments(shape: &impl ShapeT) -> Vec<IndexedSegment> {
    shape
        .lines()
        .into_iter()
        .enumerate()
        .filter_map(|(index, line)| {
            if is_degenerate_segment(&line) {
                None
            } else {
                Some(IndexedSegment { index, line })
            }
        })
        .collect()
}

pub fn are_adjacent_segments(
    a: &IndexedSegment,
    b: &IndexedSegment,
    is_polygon: bool,
    original_segment_count: usize,
) -> bool {
    if a.index == b.index {
        return true;
    }

    if a.index + 1 == b.index || b.index + 1 == a.index {
        return true;
    }

    is_polygon
        && original_segment_count >= 2
        && ((a.index == 0 && b.index + 1 == original_segment_count)
            || (b.index == 0 && a.index + 1 == original_segment_count))
}

pub fn sort_intersections(
    intersections: &mut [Intersection],
    shape1_progress: &ShapeProgressIndex,
    shape2_progress: &ShapeProgressIndex,
) {
    intersections.sort_by(|a, b| {
        let a0 = shape1_progress.key_of(&a[0]);
        let a1 = shape2_progress.key_of(&a[1]);
        let b0 = shape1_progress.key_of(&b[0]);
        let b1 = shape2_progress.key_of(&b[1]);

        a0.cmp(&b0)
            .then_with(|| a1.cmp(&b1))
            .then_with(|| frac_key(a[0].x()).cmp(&frac_key(b[0].x())))
            .then_with(|| frac_key(a[0].y()).cmp(&frac_key(b[0].y())))
            .then_with(|| frac_key(a[1].x()).cmp(&frac_key(b[1].x())))
            .then_with(|| frac_key(a[1].y()).cmp(&frac_key(b[1].y())))
    });
}

pub fn push_unique_intersection(
    out: &mut Vec<Intersection>,
    candidate: Intersection,
    shape1_progress: &ShapeProgressIndex,
    shape2_progress: &ShapeProgressIndex,
) {
    let c0 = shape1_progress.key_of(&candidate[0]);
    let c1 = shape2_progress.key_of(&candidate[1]);

    if out.iter().any(|existing| {
        shape1_progress.key_of(&existing[0]) == c0 && shape2_progress.key_of(&existing[1]) == c1
    }) {
        return;
    }

    out.push(candidate);
}

pub fn flatten_intersections(intersections: &[Intersection]) -> Vec<f64> {
    let mut out = Vec::with_capacity(intersections.len() * 6);

    for [a, b] in intersections {
        out.push(a.x());
        out.push(a.y());
        out.push(a.index() as f64);
        out.push(a.frac());
        out.push(b.index() as f64);
        out.push(b.frac());
    }

    out
}

pub fn canonical_pair_intersection(
    pt: Vector,
    seg1: &IndexedSegment,
    seg2: &IndexedSegment,
    same_shape: bool,
    shape1_is_polygon: bool,
    shape2_is_polygon: bool,
    shape1_segment_count: usize,
    shape2_segment_count: usize,
) -> Option<Intersection> {
    let frac1 = point_fraction_on_segment(pt, &seg1.line)?;
    let frac2 = point_fraction_on_segment(pt, &seg2.line)?;

    let mut out = [
        canonical_shape_position(seg1, frac1, shape1_is_polygon, shape1_segment_count),
        canonical_shape_position(seg2, frac2, shape2_is_polygon, shape2_segment_count),
    ];

    if same_shape && out[1] < out[0] {
        out.swap(0, 1);
    }

    if same_shape && out[0] == out[1] {
        return None;
    }

    Some(out)
}

pub fn canonical_shape_position(
    seg: &IndexedSegment,
    frac: f64,
    is_polygon: bool,
    segment_count: usize,
) -> ShapePosition {
    let f = normalize_frac(frac);

    if approx_eq(f, 1.0, 1.0 + scaled_epsilon(1.0))
        && owns_end_by_next(seg.index, is_polygon, segment_count)
    {
        ShapePosition::new(
            next_index(seg.index, is_polygon, segment_count),
            0.0,
            seg.line.end,
        )
    } else {
        ShapePosition::new(seg.index, f, seg.line.lerp(f))
    }
}

pub fn dedup_shape_positions_on_shape(
    positions: Vec<ShapePosition>,
    progress: &ShapeProgressIndex,
) -> Vec<ShapePosition> {
    let mut out: Vec<ShapePosition> = Vec::new();

    for pos in positions {
        let key = progress.key_of(&pos);
        if out.iter().any(|p| progress.key_of(p) == key) {
            continue;
        }
        out.push(pos);
    }

    out.sort_by(|a, b| progress.key_of(a).cmp(&progress.key_of(b)));
    out
}

fn owns_end_by_next(index: usize, is_polygon: bool, segment_count: usize) -> bool {
    is_polygon || index + 1 < segment_count
}

fn next_index(index: usize, is_polygon: bool, segment_count: usize) -> usize {
    if is_polygon {
        (index + 1) % segment_count
    } else if index + 1 < segment_count {
        index + 1
    } else {
        index
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

pub fn point_key(pt: Vector) -> (i64, i64) {
    (frac_key(pt.x()), frac_key(pt.y()))
}

pub fn is_degenerate_segment(seg: &LineSegment) -> bool {
    seg.start == seg.end
}

pub fn point_fraction_on_segment(pt: Vector, seg: &LineSegment) -> Option<f64> {
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

    let line_tol = eps * (1.0 + len2.sqrt());
    if d.cross(v).abs() > line_tol {
        return None;
    }

    let t = v.dot(d) / len2;
    clamp01_with_eps(t, eps)
}

pub fn segment_intersection_points(seg1: &LineSegment, seg2: &LineSegment) -> Vec<Vector> {
    let d1 = seg1.end.subtract(seg1.start);
    let d2 = seg2.end.subtract(seg2.start);

    let eps1 = scaled_epsilon(seg1.segment_scale());
    let eps2 = scaled_epsilon(seg2.segment_scale());

    let seg1_is_point = d1.length_squared() <= eps1 * eps1;
    let seg2_is_point = d2.length_squared() <= eps2 * eps2;

    if seg1_is_point && seg2_is_point {
        if seg1.start.approx_equals(seg2.start) {
            return vec![Vector::lerp(seg1.start, seg2.start, 0.5)];
        }
        return vec![];
    }

    if seg1_is_point {
        return if point_fraction_on_segment(seg1.start, seg2).is_some() {
            vec![seg1.start]
        } else {
            vec![]
        };
    }

    if seg2_is_point {
        return if point_fraction_on_segment(seg2.start, seg1).is_some() {
            vec![seg2.start]
        } else {
            vec![]
        };
    }

    if let Some(hit) = proper_segment_intersection(seg1, seg2) {
        return vec![hit];
    }

    fallback_near_parallel_intersection(seg1, seg2)
        .into_iter()
        .collect()
}

fn proper_segment_intersection(seg1: &LineSegment, seg2: &LineSegment) -> Option<Vector> {
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
            return Some(seg1.start.add(r.scale(mid_t)));
        }

        return None;
    }

    let t = clamp01_with_eps(qmp.cross(s) / rxs, eps)?;
    let u = clamp01_with_eps(qmp.cross(r) / rxs, eps)?;

    if !(0.0..=1.0).contains(&t) || !(0.0..=1.0).contains(&u) {
        return None;
    }

    Some(p.add(r.scale(t)))
}

fn project_fraction(pt: Vector, seg: &LineSegment) -> Option<f64> {
    let d = seg.end.subtract(seg.start);
    let len2 = d.length_squared();

    if len2 == 0.0 {
        return None;
    }

    Some(pt.subtract(seg.start).dot(d) / len2)
}

fn fallback_near_parallel_intersection(seg1: &LineSegment, seg2: &LineSegment) -> Option<Vector> {
    let candidates = [
        seg1.start,
        seg1.end,
        seg2.start,
        seg2.end,
        Vector::lerp(seg1.start, seg1.end, 0.5),
        Vector::lerp(seg2.start, seg2.end, 0.5),
    ];

    for pt in candidates {
        if point_fraction_on_segment(pt, seg1).is_some()
            && point_fraction_on_segment(pt, seg2).is_some()
        {
            return Some(pt);
        }
    }

    overlap_midpoint_if_collinearish(seg1, seg2)
}

fn overlap_midpoint_if_collinearish(seg1: &LineSegment, seg2: &LineSegment) -> Option<Vector> {
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
