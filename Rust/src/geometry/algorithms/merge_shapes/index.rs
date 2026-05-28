use std::mem;

use petgraph::unionfind::UnionFind;

use crate::geometry::algorithms::closest::{self, ClosestShapePositionsResult};
use crate::geometry::algorithms::merge_shapes::merge_polylines::merge_polylines;
use crate::geometry::algorithms::merge_shapes::min_distance::{
    BoundingBoxMinDistanceOptimization, HasDistance,
};
use crate::geometry::length_map::LengthMap;
use crate::geometry::Polygon;
use crate::geometry::{bounding_box::BoundingBox, Polyline, Shape, ShapePosition, ShapeT};

impl HasDistance for ClosestShapePositionsResult {
    fn distance(&self) -> f64 {
        self.distance
    }
}

struct ShapeMergingData {
    s1_index: usize,
    s2_index: usize,
    positions: [ShapePosition; 2],
}

// Sould be good for maybe up to 1000 Shapes
#[allow(unused)]
pub fn merge_shapes(mut shapes: Vec<Shape>) -> Shape {
    shapes.retain(|x| !x.is_empty());
    let n = shapes.len();
    if n == 0 {
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

    // merge_positions[i][0] < merge_positions[i][1]
    let mut merge_positions: Vec<ShapeMergingData> = Vec::with_capacity(shapes.len() - 1);
    let mut merged_shapes_uf = UnionFind::new(shapes.len());

    let mut guaranteed_min_distance = f64::INFINITY;
    for _ in 0..(n - 1) {
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

    let mut shapes: Vec<_> = shapes
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

    let mut res = shapes.pop().unwrap();
    debug_assert_eq!(shapes.len(), merge_positions.len());

    let pos = merge_positions
        .iter()
        .position(|x| x.s2_index == shapes.len())
        .unwrap();

    let mut merge_pos_next_index = Some(pos);

    while let Some(merge_position_index) = merge_pos_next_index.take() {
        // I have two vectors: A1, .... An and B1, .... Bm and two indices i and j and an element C and want to create a vector
        // A1 .... Ai C Bj+1 ... Bm B1 ... Bj C Ai+1 ... An

        let mut merge_position = merge_positions.remove(merge_position_index);

        if merge_position.s1_index > merge_position.s2_index {
            mem::swap(&mut merge_position.s1_index, &mut merge_position.s2_index);
            merge_position.positions.reverse();
        }

        debug_assert_eq!(merge_position.s2_index, shapes.len());
        let mut merge_shape = shapes.remove(merge_position.s1_index);

        // the last index in the new _res_ shape before insertion pos other shape
        let res_first_part_end_index = merge_position.positions[1].index();
        // the first index in the new _res_ shape where the old res shape continues
        let res_second_part_start_index = res_first_part_end_index + merge_shape.len() + 5;
        // the index of the first vertex in new _res_ which belonged to merge in shape
        let merged_second_part_start_index = res_first_part_end_index + 3;
        // everything before this index splits of
        // this is the same as the index of the first vertex inserted into _res_ inside the old
        // _merge_shape_
        let merged_split_first_len = merge_position.positions[0].index() + 1;
        // index inside new _res_ of the first vertex in old merge_shape
        let merged_first_part_start_index =
            merged_second_part_start_index + merge_shape.len() - merged_split_first_len;

        let merge_usize_data = MergedShapePositionData {
            merged_second_part_start_index,
            merged_first_part_start_index,
            merged_split_first_len,
            res_second_part_start_index,
            res_split_first_len: res_first_part_end_index + 1,
        };

        let res_tail = res.split_off(merge_position.positions[1].index() + 1);
        debug_assert_eq!(res.len(), res_first_part_end_index + 1);
        let merge_shape_tail = merge_shape.split_off(merged_split_first_len);

        res.push(merge_position.positions[1].vec());
        res.push(merge_position.positions[0].vec());
        debug_assert_eq!(res.len(), merged_second_part_start_index);
        res.extend(merge_shape_tail);
        debug_assert_eq!(res.len(), merged_first_part_start_index);
        res.extend(merge_shape);
        res.push(merge_position.positions[0].vec());
        res.push(merge_position.positions[1].vec());
        debug_assert_eq!(res.len(), res_second_part_start_index);
        res.extend(res_tail);

        merge_positions.iter_mut().enumerate().for_each(|(i, mp)| {
            if mp.s1_index == merge_position.s2_index {
                mp.positions[0] = adjusted_res_shape_position(
                    mp.positions[0],
                    &merge_usize_data,
                    &merge_position.positions[1],
                );
                merge_pos_next_index = Some(i);
            } else if mp.s2_index == merge_position.s2_index {
                mp.positions[1] = adjusted_res_shape_position(
                    mp.positions[1],
                    &merge_usize_data,
                    &merge_position.positions[1],
                );
                merge_pos_next_index = Some(i);
            }

            if mp.s1_index == merge_position.s1_index {
                mp.positions[0] = adjusted_merged_in_shape_position(
                    mp.positions[0],
                    &merge_usize_data,
                    &merge_position.positions[0],
                );

                mp.s1_index = merge_position.s2_index;
                merge_pos_next_index = Some(i);
            } else if mp.s2_index == merge_position.s1_index {
                mp.positions[1] = adjusted_merged_in_shape_position(
                    mp.positions[1],
                    &merge_usize_data,
                    &merge_position.positions[0],
                );

                mp.s2_index = merge_position.s2_index;
                merge_pos_next_index = Some(i);
            }

            if mp.s1_index >= merge_position.s1_index {
                mp.s1_index -= 1;
            }
            if mp.s2_index >= merge_position.s1_index {
                mp.s2_index -= 1;
            }

            debug_assert!(
                mp.s2_index <= merge_position.s2_index && mp.s1_index <= merge_position.s2_index
            );
            debug_assert_ne!(mp.s1_index, mp.s2_index);
        });
    }

    debug_assert_eq!(merge_positions.len(), 0);

    if is_polyline {
        Shape::Polyline(Polyline::new(res))
    } else {
        Shape::Polygon(Polygon::new(res))
    }
}

struct MergedShapePositionData {
    merged_split_first_len: usize,
    res_split_first_len: usize,
    merged_first_part_start_index: usize,
    merged_second_part_start_index: usize,
    res_second_part_start_index: usize,
}

fn adjusted_res_shape_position(
    old_pos: ShapePosition,
    merge_data: &MergedShapePositionData,
    res_shape_position_in_intersection_with_merged: &ShapePosition,
) -> ShapePosition {
    let index_in_res = old_pos.index();

    if index_in_res < res_shape_position_in_intersection_with_merged.index() {
        old_pos
    } else if index_in_res > res_shape_position_in_intersection_with_merged.index() {
        ShapePosition::new(
            merge_data.res_second_part_start_index + index_in_res - merge_data.res_split_first_len,
            old_pos.frac(),
            old_pos.vec(),
        )
    } else {
        let frac_in_res_with_merged = res_shape_position_in_intersection_with_merged.frac();
        let frac_in_merged_current = old_pos.frac();
        if frac_in_res_with_merged < frac_in_merged_current {
            ShapePosition::new(
                merge_data.res_second_part_start_index - 1,
                (1.0 - frac_in_res_with_merged) * (1.0 - frac_in_merged_current),
                old_pos.vec(),
            )
        } else {
            ShapePosition::new(
                merge_data.res_split_first_len - 1,
                frac_in_res_with_merged * frac_in_merged_current,
                old_pos.vec(),
            )
        }
    }
}

fn adjusted_merged_in_shape_position(
    old_pos: ShapePosition,
    merge_data: &MergedShapePositionData,
    merge_shape_position_in_res: &ShapePosition,
) -> ShapePosition {
    let index_in_merge_in = old_pos.index();

    if index_in_merge_in < merge_data.merged_split_first_len - 1 {
        ShapePosition::new(
            merge_data.merged_first_part_start_index + index_in_merge_in,
            old_pos.frac(),
            old_pos.vec(),
        )
    } else if index_in_merge_in > merge_data.merged_split_first_len - 1 {
        ShapePosition::new(
            merge_data.merged_second_part_start_index + index_in_merge_in
                - merge_data.merged_split_first_len,
            old_pos.frac(),
            old_pos.vec(),
        )
    } else {
        let frac_in_merged_res = merge_shape_position_in_res.frac();
        let frac_in_merged_current = old_pos.frac();
        if frac_in_merged_res < frac_in_merged_current {
            ShapePosition::new(
                merge_data.merged_second_part_start_index - 1,
                (1.0 - frac_in_merged_res) * (1.0 - frac_in_merged_current),
                old_pos.vec(),
            )
        } else {
            ShapePosition::new(
                merge_data.res_second_part_start_index - 1,
                frac_in_merged_res * frac_in_merged_current,
                old_pos.vec(),
            )
        }
    }
}
