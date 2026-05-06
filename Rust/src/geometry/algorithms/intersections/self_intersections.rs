use crate::geometry::{geometry::Geometry, shape::Shape};

use super::utils::{
    are_adjacent_by_order, build_indexed_segments, canonical_pair_intersection,
    flatten_intersections, push_unique_intersection, segment_intersections, sort_intersections,
    Intersection,
};
use rstar::RTree;
use wasm_bindgen::prelude::*;

pub fn find_self_intersections(shape: &Shape) -> Vec<Intersection> {
    let is_polygon = matches!(shape, Shape::Polygon(_));
    let segments = build_indexed_segments(shape);

    if segments.len() < 2 {
        return Vec::new();
    }

    let tree = RTree::bulk_load(segments);
    let mut intersections = Vec::new();
    let segment_count = tree.size();

    for seg1 in tree.iter() {
        let env = seg1.envelope_with_pad();

        for seg2 in tree.locate_in_envelope_intersecting(&env) {
            if seg2.order <= seg1.order {
                continue;
            }

            if are_adjacent_by_order(seg1, seg2, is_polygon, segment_count) {
                continue;
            }

            for raw in segment_intersections(&seg1.line, &seg2.line) {
                if let Some(hit) = canonical_pair_intersection(raw, seg1, seg2, true) {
                    push_unique_intersection(&mut intersections, hit);
                }
            }
        }
    }

    intersections
}

#[wasm_bindgen]
pub fn wasm_geometry_shape_selfintersections(shape_data: &[f64]) -> Option<Vec<f64>> {
    let geom = Geometry::deserialize(shape_data)?;
    let shape = Shape::from_geometry(geom)?;

    let mut intersections = find_self_intersections(&shape);

    sort_intersections(&mut intersections);
    Some(flatten_intersections(&intersections))
}
