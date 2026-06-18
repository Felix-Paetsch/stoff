use std::cmp::Ordering;
use std::collections::BinaryHeap;

use crate::geometry::algorithms::closest::{self, ClosestShapePositionsResult};
use crate::geometry::algorithms::merge_shapes::types::ShapeDistanceDatum;
use crate::geometry::bounding_box::BoundingBox;
use crate::geometry::length_map::LengthMap;
use crate::geometry::{Shape, ShapeT};

impl PartialEq for ShapeDistanceDatum {
    fn eq(&self, other: &Self) -> bool {
        self.2.distance.total_cmp(&other.2.distance) == Ordering::Equal
    }
}

impl Eq for ShapeDistanceDatum {}

impl PartialOrd for ShapeDistanceDatum {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for ShapeDistanceDatum {
    fn cmp(&self, other: &Self) -> Ordering {
        // Rust in Max_Heap, so we want larger distance to be smaller
        other.2.distance.total_cmp(&self.2.distance)
    }
}

struct BBDistanceTracker {
    s1_index: usize,
    s2_index: usize,
    bb_distance: f64,
}

pub struct LazyClosestShapePositions<'a> {
    bb_distances: Vec<BBDistanceTracker>, // Sorted from biggest to smallest
    shapes: &'a [Shape],
    lengths: Vec<Vec<f64>>,
    min_computed_distance: f64,
    computed_min_distances: BinaryHeap<ShapeDistanceDatum>,
    peaked: Option<ShapeDistanceDatum>,
}

impl<'a> LazyClosestShapePositions<'a> {
    pub fn new(shapes: &'a [Shape]) -> LazyClosestShapePositions<'a> {
        // We create a vec here as - without recomputing bbs - independent of how we loop we at some
        // point need to have all bb in memory
        let bbs: Vec<_> = shapes
            .iter()
            .map(|s| BoundingBox::from_vectors(s.vertices()).unwrap())
            .collect();

        LazyClosestShapePositions::new_with_bb(shapes, &bbs)
    }

    pub fn new_with_bb(shapes: &'a [Shape], bb: &[BoundingBox]) -> LazyClosestShapePositions<'a> {
        let n = shapes.len();
        let mut bb_distances: Vec<BBDistanceTracker> = Vec::with_capacity(n * (n - 1) / 2);

        for i in 0..n {
            for j in i + 1..n {
                bb_distances.push(BBDistanceTracker {
                    s1_index: i,
                    s2_index: j,
                    bb_distance: BoundingBox::distance(bb[i], bb[j]),
                })
            }
        }

        bb_distances.sort_by(|a, b| {
            a.bb_distance
                .partial_cmp(&b.bb_distance)
                .unwrap_or(std::cmp::Ordering::Equal)
                .reverse()
        });

        let lengths: Vec<_> = shapes
            .iter()
            .map(|s| LengthMap::new(s.lines()).into_lengths())
            .collect();

        LazyClosestShapePositions {
            shapes,
            bb_distances,
            lengths,
            min_computed_distance: f64::INFINITY,
            computed_min_distances: BinaryHeap::new(),
            peaked: None,
        }
    }

    fn compute_closest_positions(
        &self,
        index1: usize,
        index2: usize,
    ) -> ClosestShapePositionsResult {
        closest::closest_shape_positions_with_length_maps(
            &self.shapes[index1],
            &self.lengths[index1],
            &self.shapes[index2],
            &self.lengths[index2],
        )
        .unwrap()
    }

    pub fn pop(&mut self) -> Option<ShapeDistanceDatum> {
        if let Some(peeked) = self.peaked.take() {
            return Some(peeked);
        }

        while let Some(bb_last) = self.bb_distances.last() {
            if self.min_computed_distance > bb_last.bb_distance {
                let ij_dist = self.compute_closest_positions(bb_last.s1_index, bb_last.s2_index);
                self.computed_min_distances.push(ShapeDistanceDatum(
                    bb_last.s1_index,
                    bb_last.s2_index,
                    ij_dist,
                ));
                self.bb_distances.pop();
            } else {
                break;
            }
        }

        self.computed_min_distances.pop().map(|d| {
            if let Some(next_computed) = self.computed_min_distances.peek() {
                self.min_computed_distance = next_computed.2.distance
            } else {
                self.min_computed_distance = f64::INFINITY
            }

            ShapeDistanceDatum(d.0, d.1, d.2)
        })
    }

    pub fn peek(&mut self) -> Option<&ShapeDistanceDatum> {
        if self.peaked.is_some() {
            self.peaked.as_ref()
        } else {
            self.peaked = self.pop();
            self.peaked.as_ref()
        }
    }

    pub fn retain_lazy<G>(&mut self, mut retain_test: G)
    where
        // Note that f64 is a minimum guaranteed distance between the shapes
        G: FnMut(usize, usize) -> bool,
    {
        while let Some(min_computed_distance) = self.computed_min_distances.peek() {
            if retain_test(min_computed_distance.0, min_computed_distance.1) {
                break;
            }
            self.computed_min_distances.pop();
        }

        while let Some(bb_last) = self.bb_distances.last() {
            if retain_test(bb_last.s1_index, bb_last.s2_index) {
                break;
            }
            self.bb_distances.pop();
        }

        if let Some(currently_peaked) = self.peaked.as_ref() {
            if !retain_test(currently_peaked.0, currently_peaked.1) {
                self.peaked = None
            }
        }
    }
}
