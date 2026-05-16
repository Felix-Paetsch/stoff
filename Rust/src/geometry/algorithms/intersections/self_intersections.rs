use std::collections::{BTreeMap, HashMap};

use rstar::RTree;
use wasm_bindgen::prelude::*;

use super::utils::{
    are_adjacent_segments, build_indexed_segments, canonical_shape_position,
    dedup_shape_positions_on_shape, flatten_intersections, point_fraction_on_segment, point_key,
    segment_intersection_points, sort_intersections, Intersection, ShapeProgressIndex,
};
use crate::geometry::{geometry_enum::Geometry, shape::Shape, shape_trait::ShapeT, vector::Vector};

pub fn find_self_intersections(shape: &impl ShapeT) -> Vec<Intersection> {
    let segments = build_indexed_segments(shape);

    if segments.len() < 2 {
        return Vec::new();
    }

    let original_segment_count = shape.lines().len();
    let is_polygon = shape.is_polygon();
    let progress = ShapeProgressIndex::new(shape);

    let tree = RTree::bulk_load(segments.clone());

    let by_index: HashMap<usize, _> = segments
        .iter()
        .copied()
        .map(|seg| (seg.index, seg))
        .collect();

    let mut events: BTreeMap<(i64, i64), Vec<(usize, usize, Vector)>> = BTreeMap::new();

    for seg1 in &segments {
        let env = seg1.envelope_with_pad();

        for seg2 in tree.locate_in_envelope_intersecting(&env) {
            if seg2.index <= seg1.index {
                continue;
            }

            if are_adjacent_segments(seg1, seg2, is_polygon, original_segment_count) {
                continue;
            }

            for pt in segment_intersection_points(&seg1.line, &seg2.line) {
                let k = point_key(pt);
                events
                    .entry(k)
                    .or_default()
                    .push((seg1.index, seg2.index, pt));
            }
        }
    }

    let mut intersections = Vec::new();

    for (_, raw_hits) in events {
        let mut positions = Vec::new();

        for (i, j, pt) in raw_hits {
            let seg1 = match by_index.get(&i) {
                Some(s) => s,
                None => continue,
            };
            let seg2 = match by_index.get(&j) {
                Some(s) => s,
                None => continue,
            };

            if let Some(frac1) = point_fraction_on_segment(pt, &seg1.line) {
                positions.push(canonical_shape_position(
                    seg1,
                    frac1,
                    is_polygon,
                    original_segment_count,
                ));
            }

            if let Some(frac2) = point_fraction_on_segment(pt, &seg2.line) {
                positions.push(canonical_shape_position(
                    seg2,
                    frac2,
                    is_polygon,
                    original_segment_count,
                ));
            }
        }

        let positions = dedup_shape_positions_on_shape(positions, &progress);

        for a in 0..positions.len() {
            for b in (a + 1)..positions.len() {
                intersections.push([positions[a], positions[b]]);
            }
        }
    }

    intersections.dedup_by(|a, b| {
        progress.key_of(&a[0]) == progress.key_of(&b[0])
            && progress.key_of(&a[1]) == progress.key_of(&b[1])
    });
    sort_intersections(&mut intersections, &progress, &progress);

    intersections
}

#[wasm_bindgen]
pub fn wasm_geometry_shape_self_intersections(shape_data: &[f64]) -> Vec<f64> {
    let geom = Geometry::deserialize(shape_data);
    let shape = Shape::from_geometry(geom).unwrap();

    let intersections = find_self_intersections(&shape);
    flatten_intersections(&intersections)
}
