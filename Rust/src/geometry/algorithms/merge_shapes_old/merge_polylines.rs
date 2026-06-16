use crate::geometry::utils::distance_graph::distance_graph;
use crate::geometry::{Polygon, Polyline, ShapeT, Vector};
use crate::graph::algorithms::minimum_weight_perfect_matching::min_weight_matching_f64;

pub fn merge_polylines(lns: Vec<Polyline>) -> (Polyline, Vec<Polygon>) {
    debug_assert_ne!(lns.len(), 0);
    debug_assert!(lns.iter().all(|l| !l.is_empty()));

    let poly_count = lns.len();

    let mut points = Vec::with_capacity(poly_count * 2);
    for l in &lns {
        points.push(l.vertex_at(0));
        points.push(l.vertex_at(l.vertex_count() - 1));
    }

    let (raw_pairs, left_over) = pair_all_but_two(&points);

    let shapes: Vec<Vec<Vector>> = lns.into_iter().map(|pl| pl.into_vertices()).collect();
    let mut shape_connection_graph: Vec<Option<usize>> = vec![None; 2 * poly_count];

    raw_pairs.into_iter().for_each(|(a, b)| {
        shape_connection_graph[a] = Some(b);
        shape_connection_graph[b] = Some(a);
    });

    let mut shape_visitation_tracker: Vec<bool> = vec![false; poly_count];

    // First do the out polyline so we know the rest are cycles
    let out_polyline: Polyline = {
        Polyline::new(merge_vertices(
            left_over.0,
            &shapes,
            &shape_connection_graph,
            &mut shape_visitation_tracker,
        ))
    };

    let mut out_polygons: Vec<Polygon> = Vec::new();
    for shape_index in 0..poly_count {
        if shape_visitation_tracker[shape_index] {
            continue;
        }

        out_polygons.push(Polygon::new(merge_vertices(
            2 * shape_index,
            &shapes,
            &shape_connection_graph,
            &mut shape_visitation_tracker,
        )))
    }

    (out_polyline, out_polygons)
}

fn merge_vertices(
    initial_startpoint_index: usize,
    shapes: &[Vec<Vector>],
    shape_connection_graph: &[Option<usize>],
    shape_visitation_tracker: &mut [bool],
) -> Vec<Vector> {
    let mut total_len: usize = 0;
    let mut current_line_startpoint_index = initial_startpoint_index;

    loop {
        total_len += shapes[current_line_startpoint_index / 2].len();
        let current_line_endpoint_index = current_line_startpoint_index ^ 1;

        if let Some(next_line_startpoint_index) =
            shape_connection_graph[current_line_endpoint_index]
        {
            if next_line_startpoint_index == initial_startpoint_index {
                break;
            }

            current_line_startpoint_index = next_line_startpoint_index
        } else {
            break;
        }
    }

    let mut res: Vec<Vector> = Vec::with_capacity(total_len);

    let mut current_line_startpoint_index = initial_startpoint_index;

    loop {
        shape_visitation_tracker[current_line_startpoint_index / 2] = true;

        if current_line_startpoint_index.is_multiple_of(2) {
            res.extend_from_slice(&shapes[current_line_startpoint_index / 2]);
        } else {
            res.extend(shapes[current_line_startpoint_index / 2].iter().rev());
        }

        let current_line_endpoint_index = current_line_startpoint_index ^ 1;

        if let Some(next_line_startpoint_index) =
            shape_connection_graph[current_line_endpoint_index]
        {
            if next_line_startpoint_index == initial_startpoint_index {
                break;
            }

            current_line_startpoint_index = next_line_startpoint_index
        } else {
            break;
        }
    }

    debug_assert_eq!(res.len(), total_len);
    res
}

fn pair_all_but_two(points: &[Vector]) -> (Vec<(usize, usize)>, (usize, usize)) {
    let distance_graph = distance_graph(points);

    let mut matching = min_weight_matching_f64(&distance_graph);

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
