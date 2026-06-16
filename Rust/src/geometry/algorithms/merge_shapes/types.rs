use std::cmp::Ordering;

use itertools::Either;

use crate::geometry::{algorithms::closest::ClosestShapePositionsResult, ShapePosition};

#[derive(Debug, Clone)]
pub struct ShapeDistanceDatum(pub usize, pub usize, pub ClosestShapePositionsResult);

#[derive(Clone)]
pub struct ShapeEndpointPairDatum(pub ShapeEndpoint, pub ShapeEndpoint, pub f64);

#[derive(Clone, Copy)]
pub struct ShapeEndpoint(pub usize);

impl ShapeEndpoint {
    pub fn shape_index(&self) -> usize {
        self.0 / 2
    }

    pub fn is_p1(&self) -> bool {
        self.0.is_multiple_of(2)
    }
}

pub struct MergePosition(Either<ShapeEndpointPairDatum, ShapeDistanceDatum>);

impl MergePosition {
    pub fn distance(&self) -> f64 {
        self.0.as_ref().either(|a| a.2, |b| b.2.distance)
    }

    pub fn into_one_sided_positions(self) -> [OneSidedMergePosition; 2] {
        self.0.either(
            |endpoint_pair| {
                [
                    OneSidedMergePosition {
                        this: endpoint_pair.0.shape_index(),
                        that: endpoint_pair.1.shape_index(),
                        position: Either::Left(endpoint_pair.0.is_p1()),
                    },
                    OneSidedMergePosition {
                        this: endpoint_pair.1.shape_index(),
                        that: endpoint_pair.0.shape_index(),
                        position: Either::Left(endpoint_pair.1.is_p1()),
                    },
                ]
            },
            |shape_pair| {
                let [left_pos, right_pos] = shape_pair.2.positions;
                [
                    OneSidedMergePosition {
                        this: shape_pair.0,
                        that: shape_pair.1,
                        position: Either::Right(left_pos),
                    },
                    OneSidedMergePosition {
                        this: shape_pair.1,
                        that: shape_pair.0,
                        position: Either::Right(right_pos),
                    },
                ]
            },
        )
    }
}

pub struct OneSidedMergePosition {
    pub this: usize,
    pub that: usize,
    // Left is by merging lines, Right is by merging polygon
    pub position: Either<bool, ShapePosition>,
}

impl OneSidedMergePosition {
    pub fn is_endposition(&self) -> bool {
        self.position.is_left()
    }

    pub fn is_inner_position(&self) -> bool {
        self.position.is_right()
    }
}

impl Ord for OneSidedMergePosition {
    fn cmp(&self, other: &Self) -> Ordering {
        match self.this.cmp(&other.this) {
            Ordering::Less => Ordering::Less,
            Ordering::Greater => Ordering::Greater,
            Ordering::Equal => match (&self.position, &other.position) {
                (Either::Left(true), Either::Left(true)) => Ordering::Equal,
                (Either::Left(true), _) => Ordering::Less,
                (_, Either::Left(true)) => Ordering::Greater,

                (Either::Left(false), Either::Left(false)) => Ordering::Equal,
                (Either::Left(false), _) => Ordering::Greater,
                (_, Either::Left(false)) => Ordering::Less,

                (Either::Right(a), Either::Right(b)) => a.cmp(b),
            },
        }
    }
}

impl PartialOrd for OneSidedMergePosition {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl PartialEq for OneSidedMergePosition {
    fn eq(&self, other: &Self) -> bool {
        self.cmp(other) == Ordering::Equal
    }
}

impl Eq for OneSidedMergePosition {}
