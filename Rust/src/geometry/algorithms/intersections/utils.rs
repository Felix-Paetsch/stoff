use petgraph::unionfind::UnionFind;

use crate::{
    geometry::{appreciable, ShapePosition, ShapeT, Vector},
    numerics::eps::EPS_ABS,
};

pub type Intersection = [ShapePosition; 2];

fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}

fn length_along_shape_at_position(length_map: &[f64], p: ShapePosition) -> f64 {
    debug_assert!(p.index() < length_map.len());
    length_map[p.index()] + lerp(length_map[p.index()], length_map[p.index() + 1], p.frac())
}

pub fn is_shape_end(p: ShapePosition, length_map: &[f64], shape: &impl ShapeT) -> bool {
    if shape.is_polygon() {
        return false;
    }

    let total_len = length_map[length_map.len() - 1];
    let len_til_pos = length_along_shape_at_position(length_map, p);
    total_len - len_til_pos < EPS_ABS
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

pub fn deduped_self_intersections(
    p: Vec<Intersection>,
    length_map: &[f64],
    shape: &impl ShapeT,
) -> Vec<Intersection> {
    let mut uf: UnionFind<usize> = UnionFind::new(p.len());

    for i in 0..p.len() {
        for j in (i + 1)..p.len() {
            if positions_eps_agree(length_map, p[i][0], p[j][0], shape)
                && positions_eps_agree(length_map, p[i][1], p[j][1], shape)
            {
                uf.union(i, j);
            }
        }
    }

    let labels = uf.into_labeling();
    let mut out = Vec::new();

    for (i, label) in labels.into_iter().enumerate() {
        if label == i && !positions_eps_agree(length_map, p[i][0], p[i][1], shape) {
            out.push(p[i]);
        }
    }

    out
}

fn positions_eps_agree(
    length_map: &[f64],
    p: ShapePosition,
    q: ShapePosition,
    shape: &impl ShapeT,
) -> bool {
    let total_len_p = length_along_shape_at_position(length_map, p);
    let total_len_q = length_along_shape_at_position(length_map, q);

    ((total_len_p - total_len_q).abs() < EPS_ABS)
        || (shape.is_polygon()
            && (length_map[length_map.len() - 1] - (total_len_p - total_len_q).abs()) < EPS_ABS)
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
