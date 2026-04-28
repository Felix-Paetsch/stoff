use super::utils::{
    build_indexed_segments, canonical_pair_intersection, flatten_intersections,
    push_unique_intersection, segment_intersections, sort_intersections, Intersection,
};
use crate::utils::{vecf64_to_generalized_line, GeneralizedLine};
use geo::LineString;
use rstar::RTree;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn intersect_wasm(
    coords1: &[f64],
    is_polygon1: bool,
    coords2: &[f64],
    is_polygon2: bool,
) -> Option<Vec<f64>> {
    let mut line1 = vecf64_to_generalized_line(coords1);
    let mut line2 = vecf64_to_generalized_line(coords2);

    if line1 == GeneralizedLine::Empty || line2 == GeneralizedLine::Empty {
        return Some(Vec::new());
    }

    if let GeneralizedLine::Point(p1) = line1 {
        line1 = GeneralizedLine::Polyline(LineString::new(vec![p1.0, p1.0]));
    }

    if let GeneralizedLine::Point(p2) = line2 {
        line2 = GeneralizedLine::Polyline(LineString::new(vec![p2.0, p2.0]));
    }

    let GeneralizedLine::Polyline(line1) = line1 else {
        unreachable!();
    };

    let GeneralizedLine::Polyline(line2) = line2 else {
        unreachable!();
    };

    let mut intersections = find_shape_intersections(&line1, is_polygon1, &line2, is_polygon2);

    sort_intersections(&mut intersections);
    Some(flatten_intersections(&intersections))
}

pub fn find_shape_intersections(
    line1: &LineString,
    is_polygon1: bool,
    line2: &LineString,
    is_polygon2: bool,
) -> Vec<Intersection> {
    let segs1 = build_indexed_segments(line1, is_polygon1);
    let segs2 = build_indexed_segments(line2, is_polygon2);

    if segs1.is_empty() || segs2.is_empty() {
        return Vec::new();
    }

    let tree2 = RTree::bulk_load(segs2.clone());
    let mut intersections = Vec::new();

    for seg1 in &segs1 {
        let env = seg1.envelope_with_pad();

        for seg2 in tree2.locate_in_envelope_intersecting(&env) {
            for raw in segment_intersections(seg1.line, seg2.line) {
                if let Some(hit) = canonical_pair_intersection(raw, seg1, seg2, false) {
                    push_unique_intersection(&mut intersections, hit);
                }
            }
        }
    }

    intersections
}
