use std::cmp::Ordering;

use crate::{ShapeT, Vector, closest, epsilon::EPS_ABS};

#[derive(Clone, Copy, Debug)]
pub struct ShapePosition {
    start_index: usize,
    fraction: f64,
    vec: Vector,
}

impl ShapePosition {
    pub fn new(index: usize, fraction: f64, vec: Vector) -> ShapePosition {
        debug_assert!(fraction.is_finite() && (0.0..=1.0).contains(&fraction));

        ShapePosition {
            start_index: index,
            fraction,
            vec,
        }
    }

    pub fn vec(&self) -> Vector {
        self.vec
    }

    pub fn x(&self) -> f64 {
        self.vec().x()
    }

    pub fn y(&self) -> f64 {
        self.vec().y()
    }

    pub fn index(&self) -> usize {
        self.start_index
    }

    pub fn frac(&self) -> f64 {
        self.fraction
    }

    pub fn from_descriptor(
        descr: ShapePositionDescriptor,
        shape: &impl ShapeT,
    ) -> Option<ShapePosition> {
        shape_position_from_descriptor(descr, shape)
    }

    // For debug purposes mainly
    pub fn belongs_to_shape(&self, shape: &impl ShapeT) -> bool {
        if self.start_index == 0 && shape.vertex_count() < 2 {
            return true;
        }

        let actual_pos = Vector::lerp(
            shape.vertex_at(self.start_index),
            shape.vertex_at(self.start_index + 1),
            self.fraction,
        );

        actual_pos.distance(actual_pos) < EPS_ABS
    }
}

impl PartialEq for ShapePosition {
    fn eq(&self, other: &Self) -> bool {
        self.start_index == other.start_index && self.fraction == other.fraction
    }
}

impl Eq for ShapePosition {}

impl PartialOrd for ShapePosition {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for ShapePosition {
    fn cmp(&self, other: &Self) -> Ordering {
        self.index()
            .cmp(&other.index())
            .then_with(|| self.frac().total_cmp(&other.frac()))
    }
}

pub enum ShapePositionDescriptor {
    Length(f64),
    RelativeLength(f64),
    Vector(Vector),
    Start,
    End,
    ShapePosition(ShapePosition),
}

fn shape_position_from_descriptor(
    descr: ShapePositionDescriptor,
    shape: &impl ShapeT,
) -> Option<ShapePosition> {
    if shape.is_empty() {
        return None;
    }

    let pos: ShapePosition = match descr {
        ShapePositionDescriptor::ShapePosition(p) => p,
        ShapePositionDescriptor::Start => ShapePosition::new(0, 0.0, shape.vertex_at(0)),
        ShapePositionDescriptor::End => ShapePosition::new(
            shape.looping_vertex_count() - 2,
            1.0,
            shape.vertex_at(shape.looping_vertex_count() - 1),
        ),
        ShapePositionDescriptor::RelativeLength(l) => {
            return shape_position_from_descriptor(
                ShapePositionDescriptor::Length(l * shape.length()),
                shape,
            );
        }
        ShapePositionDescriptor::Length(l) => {
            let mut current_len = 0.0;
            for (start_index, line) in shape.lines().enumerate() {
                let len = line.start.distance(line.end);
                if current_len + len < l {
                    current_len += len;
                    continue;
                }

                let abs_amt = l - current_len;
                let mut fraction = abs_amt / len;
                if !fraction.is_finite() {
                    fraction = 0.5
                }

                return Some(ShapePosition::new(
                    start_index,
                    fraction,
                    Vector::lerp(line.start, line.end, fraction),
                ));
            }
            return None;
        }
        ShapePositionDescriptor::Vector(v) => {
            return closest::closest_point_on_shape(v, shape).map(|v| v.position);
        }
    };

    Some(pos)
}
