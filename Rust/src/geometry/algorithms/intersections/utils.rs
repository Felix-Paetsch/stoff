use petgraph::unionfind::UnionFind;
use rstar::{RTreeObject, AABB};

use crate::{
    geometry::{appreciable, LineSegment, ShapePosition, ShapeT, Vector},
    numerics::eps::{approx_eq, scaled_epsilon, EPS_ABS},
};

pub type Intersection = [ShapePosition; 2];

#[derive(Debug, Clone, Copy)]
pub struct IndexedSegment {
    pub index: usize,
    pub line: LineSegment,
}

impl IndexedSegment {
    pub fn envelope_with_pad(&self) -> AABB<[f64; 2]> {
        let min_x = self.line.start.x().min(self.line.end.x());
        let min_y = self.line.start.y().min(self.line.end.y());
        let max_x = self.line.start.x().max(self.line.end.x());
        let max_y = self.line.start.y().max(self.line.end.y());

        let pad = self.line.segment_scale() + EPS_ABS;

        AABB::from_corners([min_x - pad, min_y - pad], [max_x + pad, max_y + pad])
    }
}

impl RTreeObject for IndexedSegment {
    type Envelope = AABB<[f64; 2]>;

    fn envelope(&self) -> Self::Envelope {
        self.envelope_with_pad()
    }
}

fn length_along_shape_at_position(
    length_map: &[f64],
    p: ShapePosition,
    shape: &impl ShapeT,
) -> f64 {
    let line_segment_frac_length = shape.linesegment_at(p.index()).unwrap().length() * p.frac();
    line_segment_frac_length + length_map[p.index()]
}

fn positions_eps_agree(
    length_map: &[f64],
    p: ShapePosition,
    q: ShapePosition,
    shape: &impl ShapeT,
) -> bool {
    let total_len_p = length_along_shape_at_position(length_map, p, shape);
    let total_len_q = length_along_shape_at_position(length_map, q, shape);

    ((total_len_p - total_len_q).abs() < EPS_ABS)
        || (shape.is_polygon()
            && (length_map[length_map.len() - 1] - (total_len_p - total_len_q).abs()) < EPS_ABS)
}

pub fn segments_are_adjacent(
    a: &IndexedSegment,
    b: &IndexedSegment,
    length_map: &[f64],
    is_polygon: bool,
) -> bool {
    let mut test_lengths: Vec<f64> = vec![a.index, a.index + 1, b.index, b.index + 1]
        .into_iter()
        .map(|i| length_map[i])
        .collect();

    test_lengths.sort_by(|a, b| a.total_cmp(b));
    for v in test_lengths.windows(2) {
        if v[1] - v[0] < EPS_ABS {
            return true;
        }
    }

    is_polygon
        && test_lengths[0] + length_map.last().unwrap() - test_lengths.last().unwrap() < EPS_ABS
}

pub fn is_shape_end(p: ShapePosition, length_map: &[f64], shape: &impl ShapeT) -> bool {
    if shape.is_polygon() {
        return false;
    }

    let total_len = length_along_shape_at_position(length_map, p, shape);
    total_len < EPS_ABS || length_map[length_map.len() - 1] - total_len < EPS_ABS
}

pub fn shapes_are_parallel_at_position(
    s1: &impl ShapeT,
    pos1: ShapePosition,
    s2: &impl ShapeT,
    pos2: ShapePosition,
) -> bool {
    let original_line_segment1_at_position = s1.linesegment_at(pos1.index()).unwrap();
    let line_segment1 = if (EPS_ABS..=1.0 - EPS_ABS).contains(&pos1.frac())
        && original_line_segment1_at_position.length() > EPS_ABS
    {
        original_line_segment1_at_position
    } else {
        appreciable::appreciable_line_segment(s1, pos1.index()).unwrap()
    };

    let original_line_segment2_at_position = s2.linesegment_at(pos2.index()).unwrap();
    let line_segment2 = if (EPS_ABS..=1.0 - EPS_ABS).contains(&pos2.frac())
        && original_line_segment2_at_position.length() > EPS_ABS
    {
        original_line_segment2_at_position
    } else {
        appreciable::appreciable_line_segment(s2, pos2.index()).unwrap()
    };

    let angle = Vector::angle(line_segment1.vector(), line_segment2.vector()).abs();

    !(EPS_ABS..=std::f64::consts::PI - EPS_ABS).contains(&angle)
}

pub fn deduped_intersections(
    p: Vec<Intersection>,
    length_map_a: &[f64],
    length_map_b: &[f64],
    shape_a: &impl ShapeT,
    shape_b: &impl ShapeT,
) -> Vec<Intersection> {
    let mut uf: UnionFind<usize> = UnionFind::new(p.len());

    for i in 0..p.len() {
        for j in (i + 1)..p.len() {
            if positions_eps_agree(length_map_a, p[i][0], p[j][0], shape_a)
                && positions_eps_agree(length_map_b, p[i][1], p[j][1], shape_b)
            {
                uf.union(i, j);
            }
        }
    }

    let labels = uf.into_labeling();
    let mut out = Vec::new();

    for (i, label) in labels.into_iter().enumerate() {
        if label == i {
            out.push(p[i]);
        }
    }

    out
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
    shape1: &impl ShapeT,
    shape2: &impl ShapeT,
) -> Option<Intersection> {
    let frac1 = seg1.line.inverse_lerp(pt);
    let frac2 = seg2.line.inverse_lerp(pt);

    let mut out = [
        canonical_shape_position(seg1, frac1, shape1),
        canonical_shape_position(seg2, frac2, shape2),
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
    shape: &impl ShapeT,
) -> ShapePosition {
    let is_polygon = shape.is_polygon();
    let segment_count = shape.linesegment_count();

    let f = frac.clamp(0.0, 1.0);

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
