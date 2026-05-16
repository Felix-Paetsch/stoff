use rstar::RTree;
use wasm_bindgen::prelude::*;

use super::utils::{
    build_indexed_segments, canonical_pair_intersection, flatten_intersections,
    push_unique_intersection, segment_intersection_points, sort_intersections, Intersection,
    ShapeProgressIndex,
};
use crate::geometry::{geometry_enum::Geometry, shape::Shape, shape_trait::ShapeT};

pub fn find_shape_intersections(shape1: &impl ShapeT, shape2: &impl ShapeT) -> Vec<Intersection> {
    let segs1 = build_indexed_segments(shape1);
    let segs2 = build_indexed_segments(shape2);

    if segs1.is_empty() || segs2.is_empty() {
        return Vec::new();
    }

    let progress1 = ShapeProgressIndex::new(shape1);
    let progress2 = ShapeProgressIndex::new(shape2);

    let tree2 = RTree::bulk_load(segs2);
    let mut intersections = Vec::new();

    let shape1_is_polygon = shape1.is_polygon();
    let shape2_is_polygon = shape2.is_polygon();
    let shape1_segment_count = shape1.lines().len();
    let shape2_segment_count = shape2.lines().len();

    for seg1 in &segs1 {
        let env = seg1.envelope_with_pad();

        for seg2 in tree2.locate_in_envelope_intersecting(&env) {
            for pt in segment_intersection_points(&seg1.line, &seg2.line) {
                if let Some(hit) = canonical_pair_intersection(
                    pt,
                    seg1,
                    seg2,
                    false,
                    shape1_is_polygon,
                    shape2_is_polygon,
                    shape1_segment_count,
                    shape2_segment_count,
                ) {
                    push_unique_intersection(&mut intersections, hit, &progress1, &progress2);
                }
            }
        }
    }

    sort_intersections(&mut intersections, &progress1, &progress2);
    intersections
}

#[wasm_bindgen]
pub fn wasm_geometry_shape_intersections(geo1: &[f64], geo2: &[f64]) -> Vec<f64> {
    let geom1 = Geometry::deserialize(geo1);
    let geom2 = Geometry::deserialize(geo2);

    let shape1 = Shape::from_geometry(geom1).unwrap();
    let shape2 = Shape::from_geometry(geom2).unwrap();

    let intersections = find_shape_intersections(&shape1, &shape2);
    flatten_intersections(&intersections)
}
