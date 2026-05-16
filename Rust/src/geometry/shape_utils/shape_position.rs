use std::cmp::Ordering;

use crate::geometry::{
    algorithms::closest_shape_positions::closest_point_position_on_shape, shape_trait::ShapeT,
    vector::Vector,
};

#[derive(Clone, Copy, Debug)]
pub struct ShapePosition {
    pub start_index: usize,
    pub fraction: f64,
    pub vec: Vector,
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
        match self.start_index.cmp(&other.start_index) {
            Ordering::Equal => self.fraction.total_cmp(&other.fraction),
            ord => ord,
        }
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

pub fn shape_position_from_descriptor(
    descr: ShapePositionDescriptor,
    shape: &impl ShapeT,
) -> Option<ShapePosition> {
    if shape.is_empty() {
        return None;
    }

    match descr {
        ShapePositionDescriptor::ShapePosition(p) => Some(p),
        ShapePositionDescriptor::Start => Some(ShapePosition {
            start_index: 0,
            fraction: 0.0,
            vec: shape.vertices()[0],
        }),
        ShapePositionDescriptor::End => Some(ShapePosition {
            start_index: shape.vertices().len() - 2,
            fraction: 1.0,
            vec: shape.vertices().last().unwrap().clone(),
        }),
        ShapePositionDescriptor::RelativeLength(l) => shape_position_from_descriptor(
            ShapePositionDescriptor::Length(l * shape.length()),
            shape,
        ),
        ShapePositionDescriptor::Length(l) => {
            let mut current_len = 0.0;
            for (start_index, line) in shape.lines().iter().enumerate() {
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

                return Some(ShapePosition {
                    start_index,
                    fraction,
                    vec: Vector::lerp(line.start, line.end, fraction),
                });
            }
            None
        }
        ShapePositionDescriptor::Vector(v) => Some(closest_point_position_on_shape(v, shape)),
    }
}
