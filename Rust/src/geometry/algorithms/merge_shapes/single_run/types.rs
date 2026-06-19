use std::cmp::Ordering;

use itertools::Either;

use crate::geometry::{
    algorithms::merge_shapes::shared::lazy_closest_shape_positions::ShapeDistanceDatum,
    ShapePosition,
};

#[derive(Clone, Debug)]
pub struct ShapeEndpointPairDatum(pub ShapeEndpoint, pub ShapeEndpoint, pub f64);

#[derive(Clone, Copy, Debug)]
pub struct ShapeEndpoint(pub usize);

impl ShapeEndpoint {
    pub fn shape_index(&self) -> usize {
        self.0 / 2
    }

    pub fn is_p1(&self) -> bool {
        self.0.is_multiple_of(2)
    }
}

#[derive(Debug)]
pub struct MergePosition(pub Either<ShapeEndpointPairDatum, ShapeDistanceDatum>);

impl MergePosition {
    pub fn lineline(d: ShapeEndpointPairDatum) -> MergePosition {
        MergePosition(Either::Left(d))
    }

    pub fn gon(d: ShapeDistanceDatum) -> MergePosition {
        MergePosition(Either::Right(d))
    }

    pub fn into_one_sided_positions(self) -> [OneSidedMergePosition; 2] {
        self.0.either(
            |endpoint_pair| {
                [
                    OneSidedMergePosition {
                        this: endpoint_pair.0.shape_index(),
                        that: endpoint_pair.1.shape_index(),
                        position: Either::Left((endpoint_pair.0.is_p1(), endpoint_pair.1.is_p1())),
                    },
                    OneSidedMergePosition {
                        this: endpoint_pair.1.shape_index(),
                        that: endpoint_pair.0.shape_index(),
                        position: Either::Left((endpoint_pair.1.is_p1(), endpoint_pair.0.is_p1())),
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

#[derive(Debug)]
pub struct OneSidedMergePosition {
    pub this: usize,
    pub that: usize,
    // Left is by merging lines, Right is by merging polygon
    // (own_p1, other_p1) / ShapePosition
    pub position: Either<(bool, bool), ShapePosition>,
}

impl Ord for OneSidedMergePosition {
    fn cmp(&self, other: &Self) -> Ordering {
        self.this
            .cmp(&other.this)
            .then_with(|| match (&self.position, &other.position) {
                (Either::Left((true, _)), Either::Left((true, _))) => Ordering::Equal,
                (Either::Left((true, _)), _) => Ordering::Less,
                (_, Either::Left((true, _))) => Ordering::Greater,

                (Either::Left((false, _)), Either::Left((false, _))) => Ordering::Equal,
                (Either::Left((false, _)), _) => Ordering::Greater,
                (_, Either::Left((false, _))) => Ordering::Less,

                (Either::Right(a), Either::Right(b)) => a.cmp(b),
            })
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
