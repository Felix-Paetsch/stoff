use std::cmp::Ordering;
use std::collections::BinaryHeap;

use crate::geometry::bounding_box::BoundingBox;

pub trait HasDistance {
    fn distance(&self) -> f64;
}

struct HeapEntry<T: HasDistance>(usize, usize, T);

impl<T: HasDistance> PartialEq for HeapEntry<T> {
    fn eq(&self, other: &Self) -> bool {
        self.2.distance().total_cmp(&other.2.distance()) == Ordering::Equal
    }
}

impl<T: HasDistance> Eq for HeapEntry<T> {}

impl<T: HasDistance> PartialOrd for HeapEntry<T> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl<T: HasDistance> Ord for HeapEntry<T> {
    fn cmp(&self, other: &Self) -> Ordering {
        self.2.distance().total_cmp(&other.2.distance())
    }
}

struct BBDistanceTracker {
    s1_index: usize,
    s2_index: usize,
    bb_distance: f64,
}

pub struct BoundingBoxMinDistanceOptimization<F, A>
where
    F: Fn(usize, usize) -> A,
    A: HasDistance,
{
    bb_distances: Vec<BBDistanceTracker>, // Sorted from biggest to smallest
    get_distance: F,
    min_distance_lower_bound: f64,
    computed_min_distances: BinaryHeap<HeapEntry<A>>,
}

impl<F, A> BoundingBoxMinDistanceOptimization<F, A>
where
    F: Fn(usize, usize) -> A,
    A: HasDistance,
{
    pub fn new(bb: &[BoundingBox], f: F) -> BoundingBoxMinDistanceOptimization<F, A> {
        let n = bb.len();
        let mut bb_distances: Vec<BBDistanceTracker> = Vec::with_capacity(n * (n - 1) / 2);

        for i in 0..bb.len() {
            for j in i + 1..bb.len() {
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

        BoundingBoxMinDistanceOptimization {
            bb_distances,
            get_distance: f,
            min_distance_lower_bound: f64::INFINITY,
            computed_min_distances: BinaryHeap::new(),
        }
    }

    pub fn pop(&mut self) -> Option<(usize, usize, A)> {
        while let Some(bb_last) = self.bb_distances.last() {
            if self.min_distance_lower_bound > bb_last.bb_distance {
                let ij_dist = (self.get_distance)(bb_last.s1_index, bb_last.s2_index);
                self.computed_min_distances.push(HeapEntry(
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
                self.min_distance_lower_bound = next_computed.2.distance()
            } else {
                self.min_distance_lower_bound = f64::INFINITY
            }

            (d.0, d.1, d.2)
        })
    }

    pub fn retain_lazy<G>(&mut self, retain_test: G)
    where
        G: Fn((usize, usize, f64)) -> bool,
    {
        while let Some(min_computed_distance) = self.computed_min_distances.peek() {
            if retain_test((
                min_computed_distance.0,
                min_computed_distance.1,
                min_computed_distance.2.distance(),
            )) {
                break;
            }
            self.computed_min_distances.pop();
        }

        while let Some(bb_last) = self.bb_distances.last() {
            if retain_test((bb_last.s1_index, bb_last.s2_index, bb_last.bb_distance)) {
                break;
            }
            self.bb_distances.pop();
        }
    }
}
