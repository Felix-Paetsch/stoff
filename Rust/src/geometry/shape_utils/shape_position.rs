use std::cmp::Ordering;

use crate::geometry::{
    algorithms::closest_shape_positions::closest_point_position_on_shape, shape_trait::ShapeT,
    vector::Vector,
};

#[derive(Clone, Copy, Debug)]
pub struct ShapePosition {
    start_index: usize,
    fraction: f64,
    vec: Vector,
}

impl ShapePosition {
    pub fn new(index: usize, fraction: f64, vec: Vector) -> ShapePosition {
        debug_assert!(fraction.is_finite() && fraction >= 0.0 && fraction <= 1.0);
        ShapePosition {
            start_index: index,
            fraction,
            vec,
        }
    }

    pub fn sort(v: &mut [ShapePosition]) {
        v.sort_by(|a, b| {
            a.index()
                .cmp(&b.index())
                .then_with(|| a.frac().total_cmp(&b.frac()))
        });
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

    let pos: ShapePosition = match descr {
        ShapePositionDescriptor::ShapePosition(p) => p,
        ShapePositionDescriptor::Start => ShapePosition::new(0, 0.0, shape.vertices()[0]),
        ShapePositionDescriptor::End => {
            if shape.is_polygon() {
                ShapePosition::new(shape.vertices().len() - 1, 1.0, shape.vertices()[0])
            } else {
                ShapePosition::new(
                    shape.vertices().len() - 2,
                    1.0,
                    *shape.vertices().last().unwrap(),
                )
            }
        }
        ShapePositionDescriptor::RelativeLength(l) => {
            return shape_position_from_descriptor(
                ShapePositionDescriptor::Length(l * shape.length()),
                shape,
            )
        }
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

                return Some(ShapePosition::new(
                    start_index,
                    fraction,
                    Vector::lerp(line.start, line.end, fraction),
                ));
            }
            return None;
        }
        ShapePositionDescriptor::Vector(v) => return closest_point_position_on_shape(v, shape),
    };

    Some(pos)
}
