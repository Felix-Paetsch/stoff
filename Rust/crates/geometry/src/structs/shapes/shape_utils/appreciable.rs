use crate::{LineSegment, ShapeT, Vector, epsilon::EPS_ABS};

pub(crate) fn appreciable_line_segment(
    shape: &impl ShapeT,
    line_segment_index: usize,
) -> Option<LineSegment> {
    if shape.is_empty() {
        return None;
    }

    let mut left = line_segment_index % shape.linesegment_count();
    let mut right = left + 1;

    let mut max_iterations_left = shape.linesegment_count();

    let mut vert_left = shape.vertex_at(left);
    let mut vert_right = shape.vertex_at(right);

    if !vert_left.approx_equals(vert_right) {
        return Some(LineSegment::new(vert_left, vert_right));
    }

    let center = Vector::lerp(vert_left, vert_right, 0.5);

    while max_iterations_left > 0 && vert_left.approx_equals(center) {
        if let Some(prev) = prev_index(shape, left) {
            left = prev;
            max_iterations_left -= 1;
            vert_left = shape.vertex_at(left)
        } else {
            break;
        }
    }

    while max_iterations_left > 0 && vert_right.approx_equals(center) {
        if let Some(next) = next_index(shape, right) {
            right = next;
            max_iterations_left -= 1;
            vert_right = shape.vertex_at(right)
        } else {
            break;
        }
    }

    let res_left = if center.approx_equals(vert_left) {
        vert_left
    } else {
        Vector::lerp_abs(center, vert_left, EPS_ABS)
    };
    let res_right = if center.approx_equals(vert_right) {
        vert_right
    } else {
        Vector::lerp_abs(center, vert_right, EPS_ABS)
    };

    Some(LineSegment::new(res_left, res_right))
}

#[allow(dead_code)]
pub(crate) fn appreciable_corner(
    shape: &impl ShapeT,
    at: usize,
) -> Option<(LineSegment, LineSegment)> {
    if shape.is_empty() {
        return None;
    }

    let center_index = at % shape.vertex_count();
    let mut left = prev_index(shape, center_index)?;
    let mut right = next_index(shape, center_index)?;

    let center = shape.vertex_at(center_index);
    let mut vert_left = shape.vertex_at(left);
    let mut vert_right = shape.vertex_at(right);

    if !vert_left.approx_equals(center) && !vert_right.approx_equals(center) {
        return Some((
            LineSegment::new(vert_left, center),
            LineSegment::new(center, vert_right),
        ));
    }

    let mut max_iterations_left = shape.vertex_count();

    while max_iterations_left > 0 && vert_left.approx_equals(center) {
        if let Some(prev) = prev_index(shape, left) {
            left = prev;
            max_iterations_left -= 1;
            vert_left = shape.vertex_at(left);
        } else {
            break;
        }
    }

    while max_iterations_left > 0 && vert_right.approx_equals(center) {
        if let Some(next) = next_index(shape, right) {
            right = next;
            max_iterations_left -= 1;
            vert_right = shape.vertex_at(right);
        } else {
            break;
        }
    }

    let res_left = if center.approx_equals(vert_left) {
        vert_left
    } else {
        Vector::lerp_abs(center, vert_left, EPS_ABS)
    };

    let res_right = if center.approx_equals(vert_right) {
        vert_right
    } else {
        Vector::lerp_abs(center, vert_right, EPS_ABS)
    };

    Some((
        LineSegment::new(res_left, center),
        LineSegment::new(center, res_right),
    ))
}

fn next_index(shape: &impl ShapeT, current_index: usize) -> Option<usize> {
    if current_index + 1 < shape.vertex_count() {
        Some(current_index + 1)
    } else if shape.is_polygon() {
        Some(0)
    } else {
        None
    }
}

fn prev_index(shape: &impl ShapeT, current_index: usize) -> Option<usize> {
    if current_index > 0 {
        Some(current_index - 1)
    } else if shape.is_polygon() {
        Some(shape.vertex_count() - 1)
    } else {
        None
    }
}
