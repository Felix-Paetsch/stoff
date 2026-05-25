use crate::geometry::{
    algorithms::closest::{
        closest_linesegment_point::closest_point_on_linesegment, shared::RecursiveLineBoundary,
    },
    length_map::LengthMap,
    LineSegment, ShapePosition, ShapeT, Vector,
};

pub struct ClosestPointOnShapeResult {
    pub position: ShapePosition,
    pub distance: f64,
}

pub fn closest_point_on_shape(
    point: Vector,
    shape: &impl ShapeT,
) -> Option<ClosestPointOnShapeResult> {
    let mut closest_position: Option<ShapePosition> = None;
    let mut closest_distance = f64::INFINITY;

    for (index, segment) in shape.lines().enumerate() {
        let closest = closest_point_on_linesegment(segment, point);

        if closest.distance < closest_distance {
            closest_distance = closest.distance;
            closest_position = Some(ShapePosition::new(index, closest.fraction, closest.vector));
        }
    }

    closest_position.map(|v| ClosestPointOnShapeResult {
        position: v,
        distance: closest_distance,
    })
}

pub fn closest_point_on_shape_with_length_map(
    point: Vector,
    shape: &impl ShapeT,
    length_map: &LengthMap,
) -> Option<ClosestPointOnShapeResult> {
    if shape.vertex_count() < 50 {
        return closest_point_on_shape(point, shape);
    }

    let lengths = length_map.lengths();
    let as_polyline = shape.clone_to_shape().into_polyline().clone();
    let vertices = as_polyline.vertices();
    closest_point_on_shape_with_length_map_recursion(
        vertices,
        lengths,
        RecursiveLineBoundary {
            vertex_index: 0,
            guaranteed_distance: Vector::distance(point, vertices[0]),
        },
        RecursiveLineBoundary {
            vertex_index: vertices.len() - 1,
            guaranteed_distance: Vector::distance(point, *vertices.last().unwrap()),
        },
        f64::INFINITY,
        point,
    )
}

pub fn closest_point_on_shape_with_length_map_recursion(
    vertices: &[Vector],
    lengths: &[f64],
    left: RecursiveLineBoundary,
    right: RecursiveLineBoundary,
    best_dist_so_far: f64,
    point: Vector,
) -> Option<ClosestPointOnShapeResult> {
    if left.vertex_index + 1 == right.vertex_index {
        let seg = LineSegment {
            start: vertices[left.vertex_index],
            end: vertices[right.vertex_index],
        };

        let closest = closest_point_on_linesegment(seg, point);
        return if closest.distance < best_dist_so_far {
            Some(ClosestPointOnShapeResult {
                position: ShapePosition::new(left.vertex_index, closest.fraction, closest.vector),
                distance: closest.distance,
            })
        } else {
            None
        };
    } else if left.vertex_index == right.vertex_index {
        let distance = vertices[left.vertex_index].distance(point);
        return if distance < best_dist_so_far {
            Some(ClosestPointOnShapeResult {
                position: ShapePosition::new(left.vertex_index, 0.0, vertices[left.vertex_index]),
                distance,
            })
        } else {
            None
        };
    }

    let middle_index = (right.vertex_index + left.vertex_index) / 2;
    let len_left_middle = lengths[middle_index] - lengths[left.vertex_index];
    let len_middle_right = lengths[right.vertex_index] - lengths[middle_index];

    if right.guaranteed_distance - len_middle_right >= best_dist_so_far
        || left.guaranteed_distance - len_left_middle >= best_dist_so_far
    {
        return None;
    }

    let middle_distance = vertices[middle_index].distance(point);
    if middle_distance - len_middle_right >= best_dist_so_far
        || middle_distance - len_left_middle >= best_dist_so_far
    {
        return None;
    }

    let middle = RecursiveLineBoundary {
        vertex_index: middle_index,
        guaranteed_distance: middle_distance,
    };

    let pos_option_left = closest_point_on_shape_with_length_map_recursion(
        vertices,
        lengths,
        left,
        middle,
        best_dist_so_far,
        point,
    );

    let Some(pos1) = &pos_option_left else {
        return closest_point_on_shape_with_length_map_recursion(
            vertices,
            lengths,
            middle,
            right,
            best_dist_so_far,
            point,
        );
    };

    closest_point_on_shape_with_length_map_recursion(
        vertices,
        lengths,
        middle,
        right,
        pos1.distance,
        point,
    )
    .or(pos_option_left)
}
