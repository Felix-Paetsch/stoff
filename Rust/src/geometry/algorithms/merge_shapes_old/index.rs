use nalgebra::Vector3;
use petgraph::unionfind::UnionFind;

use crate::geometry::algorithms::closest::{self, ClosestShapePositionsResult};
use crate::geometry::algorithms::merge_shapes::merge_polylines::merge_polylines;
use crate::geometry::algorithms::merge_shapes::min_distance::{
    BoundingBoxMinDistanceOptimization, HasDistance,
};
use crate::geometry::length_map::LengthMap;
use crate::geometry::{bounding_box::BoundingBox, Polyline, Shape, ShapePosition, ShapeT};
use crate::geometry::{Polygon, Vector};

impl HasDistance for ClosestShapePositionsResult {
    fn distance(&self) -> f64 {
        self.distance
    }
}

struct ShapeMergingPoint {
    next_shape: usize,
    own_shape_position: ShapePosition,
}

impl ShapeMergingPoint {
    fn shape_position() -> ShapePosition {
        todo!();
    }
}

struct ShapeMergingDataStorage {}
impl ShapeMergingDataStorage {
    fn ordered_shape_merging_data(
        &self,
        for_shape: usize,
    ) -> impl Iterator<Item = ShapeMergingPoint> {
        todo!();
    }

    fn ordered_merge_into_data(
        &self,
        current_shape_index: usize,
        prev_shape_index: usize,
    ) -> (ShapePosition, impl Iterator<Item = ShapeMergingPoint>) {
        todo!();
    }
}

pub fn merge_shapes(mut shapes: Vec<Shape>) -> Shape {
    shapes.retain(|x| !x.is_empty());
    if shapes.is_empty() {
        return Shape::Polyline(Polyline::empty());
    }

    let (polylines, polygons): (Vec<_>, Vec<_>) = shapes.into_iter().partition(|s| s.is_polyline());

    let mut shapes: Vec<Shape> = polygons;
    let mut is_polyline: bool = false;

    if !polylines.is_empty() {
        let (new_polyline, merged_gons) =
            merge_polylines(polylines.into_iter().map(|l| l.into_polyline()).collect());

        is_polyline = true;

        shapes.extend(merged_gons.into_iter().map(Shape::Polygon));
        shapes.push(Shape::Polyline(new_polyline));
    }

    if shapes.len() == 1 {
        return shapes.pop().unwrap().clone_to_shape();
    }

    let merge_positions = compute_merge_positions(&shapes);

    let shapes: Vec<_> = shapes
        .into_iter()
        .map(|s| {
            if s.is_polyline() {
                s.into_vertices()
            } else {
                let mut verts = s.into_vertices();
                verts.push(verts[0]);
                verts
            }
        })
        .collect();

    let total_shape_vertices = shapes.iter().map(|v| v.len()).reduce(|a, b| a + b).unwrap();

    let mut merged_vertices: Vec<Vector> =
        Vec::with_capacity(total_shape_vertices + 4 * (shapes.len() - 1));

    populate_shape_vertices_recursion(
        &mut merged_vertices,
        &shapes,
        &merge_positions,
        ShapeMergingStart::Init,
        shapes.len() - 1,
    );

    if is_polyline {
        Shape::Polyline(Polyline::new(merged_vertices))
    } else {
        Shape::Polygon(Polygon::new(merged_vertices))
    }
}

enum ShapeMergingStart {
    Init,
    AfterShape(usize),
}

// merge: start position, end position as input
fn populate_shape_vertices_recursion(
    res: &mut Vec<Vector>,
    shapes: &[Vec<Vector>],
    merge_positions: &ShapeMergingDataStorage,
    starting_at: ShapeMergingStart,
    current_shape_index: usize,
) {
    match starting_at {
        ShapeMergingStart::Init => {
            let middle_positions = merge_positions.ordered_shape_merging_data(current_shape_index);

            let mut vertex_to_include_slice_from: usize = 0;
            for pos in middle_positions {
                let own_pos = pos.own_shape_position;

                res.extend_from_slice(
                    shapes[current_shape_index]
                        .get(vertex_to_include_slice_from..own_pos.index() + 1)
                        .unwrap(),
                );

                vertex_to_include_slice_from = pos.own_shape_position.index();

                res.push(own_pos.vec());
                populate_shape_vertices_recursion(
                    res,
                    shapes,
                    merge_positions,
                    ShapeMergingStart::AfterShape(current_shape_index),
                    pos.next_shape,
                );
                res.push(own_pos.vec());
            }

            res.extend_from_slice(
                shapes[current_shape_index]
                    .get(vertex_to_include_slice_from..shapes[current_shape_index].len())
                    .unwrap(),
            );
        }
        ShapeMergingStart::AfterShape(old_shape_index) => {
            let (start_position, middle_positions) =
                merge_positions.ordered_merge_into_data(current_shape_index, old_shape_index);

            let middle_positions = merge_positions.ordered_shape_merging_data(current_shape_index);

            let mut vertex_to_include_slice_from: usize = start_position;
            for pos in middle_positions {
                let own_pos = pos.own_shape_position;

                res.extend_from_slice(
                    shapes[current_shape_index]
                        .get(vertex_to_include_slice_from..own_pos.index() + 1)
                        .unwrap(),
                );

                vertex_to_include_slice_from = pos.own_shape_position.index();

                res.push(own_pos.vec());
                populate_shape_vertices_recursion(
                    res,
                    shapes,
                    merge_positions,
                    ShapeMergingStart::AfterShape(current_shape_index),
                    pos.next_shape,
                );
                res.push(own_pos.vec());
            }

            res.extend_from_slice(
                shapes[current_shape_index]
                    .get(vertex_to_include_slice_from..shapes[current_shape_index].len())
                    .unwrap(),
            );
        }
    }
}

fn compute_merge_positions(shapes: &[Shape]) -> ShapeMergingDataStorage {
    let bounding_boxes: Vec<BoundingBox> = shapes
        .iter()
        .map(|s| BoundingBox::from_vectors(s.vertices()).unwrap())
        .collect();

    let length_maps: Vec<_> = shapes.iter().map(|s| LengthMap::new(s.lines())).collect();
    let mut min_distance_computer =
        BoundingBoxMinDistanceOptimization::new(&bounding_boxes, |i, j| {
            closest::closest_shape_positions_with_length_maps(
                &shapes[i],
                length_maps[i].lengths(),
                &shapes[j],
                length_maps[j].lengths(),
            )
            .unwrap()
        });

    let mut merge_positions: Vec<ShapeMergingData> = Vec::with_capacity(shapes.len() - 1);
    let mut merged_shapes_uf = UnionFind::new(shapes.len());

    for _ in 0..(shapes.len() - 1) {
        min_distance_computer.retain_lazy(|(i, j, _)| !merged_shapes_uf.equiv(i, j));
        let closest = min_distance_computer.pop().unwrap();

        merged_shapes_uf.union(closest.0, closest.1);
        merge_positions.push(ShapeMergingData {
            s1_index: closest.0,
            s2_index: closest.1,
            positions: closest.2.positions,
        });
    }

    debug_assert!(merge_positions.iter().all(|v| v.s1_index < v.s2_index));
    merge_positions
}
