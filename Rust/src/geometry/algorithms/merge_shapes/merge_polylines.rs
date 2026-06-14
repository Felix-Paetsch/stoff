use crate::debug::*;

use crate::geometry::utils::distance_graph::distance_graph;
use crate::geometry::{Polygon, Polyline, ShapeT, Vector};
use crate::graph::algorithms::minimum_weight_perfect_matching::min_weight_matching_f64;
use petgraph::unionfind::UnionFind;

struct MergePair {
    a_poly: usize,
    a_end: usize,
    b_poly: usize,
    b_end: usize,
}

// Should be good for maybe up to 10_000?
// Could be improved with grid based lookups?
pub fn merge_polylines(lns: Vec<Polyline>) -> (Polyline, Vec<Polygon>) {
    debug_assert_ne!(lns.len(), 0);
    debug_assert!(lns.iter().all(|l| !l.is_empty()));

    let poly_count = lns.len();

    let mut points = Vec::with_capacity(poly_count * 2);
    for l in &lns {
        points.push(l.vertex_at(0));
        points.push(l.vertex_at(l.vertex_count() - 1));
    }

    let (raw_pairs, _) = pair_all_but_two(&points);

    let mut shapes: Vec<Option<Vec<Vector>>> =
        lns.into_iter().map(|pl| Some(pl.into_vertices())).collect();

    let mut uf = UnionFind::<usize>::new(poly_count);
    let mut component_is_polygon = vec![false; poly_count];

    for (a, b) in raw_pairs {
        let pair = MergePair {
            a_poly: a / 2,
            a_end: a % 2,
            b_poly: b / 2,
            b_end: b % 2,
        };

        let ra = uf.find(pair.a_poly);
        let rb = uf.find(pair.b_poly);

        if ra == rb {
            component_is_polygon[ra] = true;
            continue;
        }

        let va = shapes[ra].take().unwrap();
        let vb = shapes[rb].take().unwrap();

        let merged = merge_shape_vectors(va, pair.a_end, vb, pair.b_end);
        uf.union(ra, rb);
        let r = uf.find(ra);

        shapes[r] = Some(merged);
        debug_assert!(!component_is_polygon[r]);
    }

    let mut merged_polyline = None;
    let mut polygons = Vec::new();

    for i in 0..poly_count {
        let r = uf.find(i);
        if r != i {
            continue;
        }

        let vertices = shapes[i]
            .take()
            .expect("root should always have shape vertices");

        if component_is_polygon[i] {
            polygons.push(Polygon::new(vertices));
        } else {
            debug_assert!(merged_polyline.is_none());
            merged_polyline = Some(Polyline::new(vertices));
        }
    }

    (
        merged_polyline.expect("expected exactly one non-polygon component"),
        polygons,
    )
}

fn merge_shape_vectors(
    mut a: Vec<Vector>,
    a_end: usize,
    mut b: Vec<Vector>,
    b_end: usize,
) -> Vec<Vector> {
    match (a_end, b_end) {
        (1, 0) => {
            a.extend(b);
            a
        }
        (1, 1) => {
            b.reverse();
            a.extend(b);
            a
        }
        (0, 0) => {
            a.reverse();
            a.extend(b);
            a
        }
        (0, 1) => {
            b.extend(a);
            b
        }
        _ => unreachable!(),
    }
}

pub fn pair_all_but_two(points: &[Vector]) -> (Vec<(usize, usize)>, (usize, usize)) {
    let distance_graph = distance_graph(points);

    let mut matching = min_weight_matching_f64(&distance_graph);
    debug_log_1(&matching);

    let mut curr_max_distance = points[matching[0].0].distance(points[matching[0].1]);
    let mut curr_max_index = 0;

    for i in 1..matching.len() {
        let d = points[matching[i].0].distance(points[matching[i].1]);
        if d > curr_max_distance {
            curr_max_distance = d;
            curr_max_index = i;
        }
    }

    let left_over = matching.remove(curr_max_index);
    (matching, left_over)
}
