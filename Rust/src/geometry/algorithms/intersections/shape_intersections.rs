use super::utils::{
    build_indexed_segments, canonical_pair_intersection, flatten_intersections,
    push_unique_intersection, segment_intersections, sort_intersections, Intersection,
};
use crate::geometry::{geometry::Geometry, shape::Shape};
use rstar::RTree;
use wasm_bindgen::prelude::*;

pub fn find_shape_intersections(shape1: &Shape, shape2: &Shape) -> Vec<Intersection> {
    let segs1 = build_indexed_segments(shape1);
    let segs2 = build_indexed_segments(shape2);

    if segs1.is_empty() || segs2.is_empty() {
        return Vec::new();
    }

    let tree2 = RTree::bulk_load(segs2);
    let mut intersections = Vec::new();

    for seg1 in &segs1 {
        let env = seg1.envelope_with_pad();

        for seg2 in tree2.locate_in_envelope_intersecting(&env) {
            for raw in segment_intersections(&seg1.line, &seg2.line) {
                if let Some(hit) = canonical_pair_intersection(raw, seg1, seg2, false) {
                    push_unique_intersection(&mut intersections, hit);
                }
            }
        }
    }

    intersections
}

#[wasm_bindgen]
pub fn wasm_geometry_shape_intersections(geo1: &[f64], geo2: &[f64]) -> Option<Vec<f64>> {
    let geom1 = Geometry::deserialize(geo1)?;
    let geom2 = Geometry::deserialize(geo2)?;

    let shape1 = Shape::from_geometry(geom1)?;
    let shape2 = Shape::from_geometry(geom2)?;

    let mut intersections = find_shape_intersections(&shape1, &shape2);

    sort_intersections(&mut intersections);
    Some(flatten_intersections(&intersections))
}
