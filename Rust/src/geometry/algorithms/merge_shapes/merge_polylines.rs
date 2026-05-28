use crate::geometry::{Polygon, Polyline, ShapeT, Vector};
use kdtree::distance::squared_euclidean;
use kdtree::KdTree;
use petgraph::unionfind::UnionFind;

struct Edge {
    a: usize,
    b: usize,
    dist2: f64,
}

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
    let n = points.len();
    let target_pair_count = n / 2 - 1;

    let mut tree = KdTree::new(2);
    for (i, p) in points.iter().copied().enumerate() {
        tree.add(p.into_array(), i).unwrap();
    }

    let mut edges = Vec::<Edge>::new();

    // For each point, collect a few nearest-neighbor candidate edges.
    // Increase this number if pair quality is poor.
    let k = 8usize.min(n.saturating_sub(1));

    for (i, p) in points.iter().copied().enumerate() {
        let neighbors = tree
            .nearest(&p.into_array(), k + 1, &squared_euclidean)
            .unwrap();

        for (dist2, &j) in neighbors {
            if i == j {
                continue;
            }

            let (a, b) = if i < j { (i, j) } else { (j, i) };
            edges.push(Edge { a, b, dist2 });
        }
    }

    edges.sort_by(|e1, e2| e1.dist2.total_cmp(&e2.dist2));
    edges.dedup_by(|e1, e2| e1.a == e2.a && e1.b == e2.b);

    let mut used = vec![false; n];
    let mut pairs = Vec::with_capacity(target_pair_count);

    for edge in edges {
        if pairs.len() == target_pair_count {
            break;
        }

        if used[edge.a] || used[edge.b] {
            continue;
        }

        used[edge.a] = true;
        used[edge.b] = true;
        pairs.push((edge.a, edge.b));
    }

    // Fallback: if candidate edges were insufficient, complete greedily by brute force.
    // Can be optimized!!
    while pairs.len() < target_pair_count {
        let mut best: Option<(usize, usize, f64)> = None;

        for i in 0..n {
            if used[i] {
                continue;
            }

            for j in (i + 1)..n {
                if used[j] {
                    continue;
                }

                let dist2 = points[i].distance_squared(points[j]);
                match best {
                    None => best = Some((i, j, dist2)),
                    Some((_, _, best_dist2)) if dist2 < best_dist2 => {
                        best = Some((i, j, dist2));
                    }
                    _ => {}
                }
            }
        }

        let (i, j, _) = best.expect("not enough remaining points to complete pairing");
        used[i] = true;
        used[j] = true;
        pairs.push((i, j));
    }

    let leftovers: Vec<_> = used
        .iter()
        .enumerate()
        .filter_map(|(i, &is_used)| if !is_used { Some(i) } else { None })
        .collect();

    assert!(leftovers.len() == 2);

    (pairs, (leftovers[0], leftovers[1]))
}
