use rstar::RTree;
use wasm_bindgen::prelude::*;

use crate::geometry::{
    algorithms::intersections::utils::{
        canonical_pair_intersection, deduped_intersections, flatten_intersections, is_shape_end,
        shapes_are_parallel_at_position, IndexedSegment, Intersection,
    },
    Geometry, LineSegment, Shape, ShapeT,
};

pub fn find_shape_intersections(shape1: &impl ShapeT, shape2: &impl ShapeT) -> Vec<Intersection> {
    let lines1 = shape1.lines();
    let lines2 = shape2.lines();

    if lines1.is_empty() || lines2.is_empty() {
        return Vec::new();
    }

    let mut length1 = 0.0;
    let mut length2 = 0.0;

    let mut segs1 = Vec::with_capacity(lines1.len());
    let mut segs2 = Vec::with_capacity(lines2.len());
    let mut length_map1 = Vec::with_capacity(lines1.len() + 1);
    let mut length_map2 = Vec::with_capacity(lines2.len() + 1);

    length_map1.push(0.0);
    for (i, segment) in lines1.iter().enumerate() {
        length1 += segment.length();
        length_map1.push(length1);

        if segment.start.eq(&segment.end) {
            continue;
        }

        segs1.push(IndexedSegment {
            index: i,
            line: *segment,
        });
    }

    length_map2.push(0.0);
    for (i, segment) in lines2.iter().enumerate() {
        length2 += segment.length();
        length_map2.push(length2);

        if segment.start.eq(&segment.end) {
            continue;
        }

        segs2.push(IndexedSegment {
            index: i,
            line: *segment,
        });
    }

    if segs1.is_empty() || segs2.is_empty() {
        return Vec::new();
    }

    let tree2 = RTree::bulk_load(segs2.clone());
    let mut intersections = Vec::new();

    for seg1 in &segs1 {
        let env = seg1.envelope_with_pad();

        for seg2 in tree2.locate_in_envelope_intersecting(&env) {
            if let Some(pt) = LineSegment::intersection(&seg1.line, &seg2.line) {
                let Some(intersection) =
                    canonical_pair_intersection(pt, seg1, seg2, false, shape1, shape2)
                else {
                    continue;
                };

                if is_shape_end(intersection[0], &length_map1, shape1)
                    || is_shape_end(intersection[1], &length_map2, shape2)
                    || !shapes_are_parallel_at_position(
                        shape1,
                        intersection[0],
                        shape2,
                        intersection[1],
                    )
                {
                    intersections.push(intersection);
                }
            }
        }
    }

    deduped_intersections(intersections, &length_map1, &length_map2, shape1, shape2)
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
