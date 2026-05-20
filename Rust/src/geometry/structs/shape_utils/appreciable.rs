use crate::{geometry::*, numerics::eps::EPS_ABS};

pub fn appreciable_line_segment(
    shape: &impl ShapeT,
    mut line_segment_index: usize,
) -> Option<LineSegment> {
    let vertices = shape.vertices();

    if vertices.len() < 2 {
        return None;
    }

    if shape.is_polygon() {
        line_segment_index =
            (vertices.len() + (line_segment_index % vertices.len())) % vertices.len();
    }

    if line_segment_index >= vertices.len().saturating_sub(1) {
        return None;
    }

    let mut left = line_segment_index;
    let mut right = line_segment_index + 1;

    if !vertices[left].approx_equals(vertices[right]) {
        return Some(LineSegment::new(vertices[left], vertices[right]));
    }

    let center = Vector::lerp(vertices[left], vertices[right], 0.5);

    while left > 0 && vertices[left].approx_equals(center) {
        left -= 1;
    }

    while right + 1 < vertices.len() && vertices[right].approx_equals(center) {
        right += 1;
    }

    Some(LineSegment::new(
        Vector::lerp(center, vertices[left], EPS_ABS),
        Vector::lerp(center, vertices[right], EPS_ABS),
    ))
}

#[allow(dead_code)]
pub fn appreciable_corner(shape: &impl ShapeT, at: usize) -> Option<(LineSegment, LineSegment)> {
    let vertices = shape.vertices();

    if shape.is_empty() {
        return None;
    }

    let center = *vertices.get(at)?;
    let mut left = prev_index(shape, at)?;
    let mut right = next_index(shape, at)?;

    if !vertices[left].approx_equals(center) && !vertices[right].approx_equals(center) {
        return Some((
            LineSegment {
                start: vertices[left],
                end: center,
            },
            LineSegment {
                start: center,
                end: vertices[right],
            },
        ));
    }

    while vertices[left].approx_equals(center) && left != at {
        left = prev_index(shape, left)?;
    }

    while vertices[right].approx_equals(center) && right != at {
        right = next_index(shape, right)?;
    }

    Some((
        LineSegment {
            start: vertices[left],
            end: center,
        },
        LineSegment {
            start: center,
            end: vertices[right],
        },
    ))
}

fn next_index(shape: &impl ShapeT, current_index: usize) -> Option<usize> {
    if current_index + 1 < shape.vertices().len() {
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
        Some(shape.vertices().len() - 1)
    } else {
        None
    }
}
