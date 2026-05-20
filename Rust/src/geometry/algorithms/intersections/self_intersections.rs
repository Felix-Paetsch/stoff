use rstar::RTree;
use wasm_bindgen::prelude::*;

use crate::geometry::{
    algorithms::intersections::utils::{
        canonical_pair_intersection, deduped_intersections, flatten_intersections, is_shape_end,
        segments_are_adjacent, shapes_are_parallel_at_position, IndexedSegment, Intersection,
    },
    Geometry, LineSegment, Shape, ShapeT,
};

pub fn find_self_intersections(shape: &impl ShapeT) -> Vec<Intersection> {
    let lines = shape.lines();
    if lines.len() < 3 {
        return Vec::new();
    }

    let mut length = 0.0;
    let mut segments = Vec::with_capacity(lines.len());
    let mut length_map: Vec<f64> = Vec::with_capacity(lines.len() + 1);
    length_map.push(0.0);

    for (i, segment) in lines.iter().enumerate() {
        length += segment.length();
        length_map.push(length);

        if segment.start.eq(&segment.end) {
            continue;
        }

        segments.push(IndexedSegment {
            index: i,
            line: *segment,
        });
    }

    if segments.len() < 2 {
        return Vec::new();
    }

    let is_polygon = shape.is_polygon();
    let tree = RTree::bulk_load(segments.clone());

    let mut intersections: Vec<Intersection> = Vec::new();

    for seg1 in &segments {
        let env = seg1.envelope_with_pad();

        for seg2 in tree.locate_in_envelope_intersecting(&env) {
            if seg2.index <= seg1.index {
                continue;
            }

            if segments_are_adjacent(seg1, seg2, &length_map, is_polygon) {
                continue;
            }

            if let Some(pt) = LineSegment::intersection(&seg1.line, &seg2.line) {
                let Some(intersection) =
                    canonical_pair_intersection(pt, seg1, seg2, true, shape, shape)
                else {
                    continue;
                };

                if is_shape_end(intersection[0], &length_map, shape)
                    || is_shape_end(intersection[1], &length_map, shape)
                    || !shapes_are_parallel_at_position(
                        shape,
                        intersection[0],
                        shape,
                        intersection[1],
                    )
                {
                    intersections.push(intersection);
                }
            }
        }
    }

    deduped_intersections(intersections, &length_map, &length_map, shape, shape)
}

#[wasm_bindgen]
pub fn wasm_geometry_shape_self_intersections(shape_data: &[f64]) -> Vec<f64> {
    let geom = Geometry::deserialize(shape_data);
    let shape = Shape::from_geometry(geom).unwrap();

    let intersections = find_self_intersections(&shape);
    flatten_intersections(&intersections)
}
