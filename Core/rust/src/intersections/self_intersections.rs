use super::utils::{
    are_adjacent_by_order, build_indexed_segments, canonical_pair_intersection,
    flatten_intersections, push_unique_intersection, segment_intersections, sort_intersections,
    Intersection,
};
use crate::utils::vecf64_to_linestring;
use geo::LineString;
use rstar::RTree;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn self_intersections_wasm(coords: &[f64], is_polygon: bool) -> Option<Vec<f64>> {
    let line = vecf64_to_linestring(coords)?;
    let mut intersections = find_self_intersections(&line, is_polygon);

    sort_intersections(&mut intersections);
    Some(flatten_intersections(&intersections))
}

pub fn find_self_intersections(line: &LineString, is_polygon: bool) -> Vec<Intersection> {
    let segments = build_indexed_segments(&line, is_polygon);

    if segments.len() < 2 {
        return Vec::new();
    }

    let tree = RTree::bulk_load(segments.clone());
    let mut intersections = Vec::new();

    for seg1 in &segments {
        let env = seg1.envelope_with_pad();

        for seg2 in tree.locate_in_envelope_intersecting(&env) {
            if seg2.order <= seg1.order {
                continue;
            }

            if are_adjacent_by_order(seg1, seg2, is_polygon, segments.len()) {
                continue;
            }

            for raw in segment_intersections(seg1.line, seg2.line) {
                if let Some(hit) = canonical_pair_intersection(raw, seg1, seg2, true) {
                    push_unique_intersection(&mut intersections, hit);
                }
            }
        }
    }

    intersections
}
