use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap};

use crate::grid::grid_struct::GridPosition;

#[derive(Debug, Clone, Copy)]
struct Entry {
    key: [usize; 2],
    value: f64,
}

impl PartialEq for Entry {
    fn eq(&self, other: &Self) -> bool {
        self.key == other.key && self.value.to_bits() == other.value.to_bits()
    }
}

impl Eq for Entry {}

impl PartialOrd for Entry {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for Entry {
    fn cmp(&self, other: &Self) -> Ordering {
        match self.value.total_cmp(&other.value) {
            Ordering::Equal => self.key.cmp(&other.key),
            // reverse so BinaryHeap becomes a min-heap by value
            ord => ord.reverse(),
        }
    }
}

pub struct FastMarchingHeap {
    heap: BinaryHeap<Entry>,
    best: HashMap<[usize; 2], f64>,
}

impl FastMarchingHeap {
    pub fn new() -> FastMarchingHeap {
        FastMarchingHeap {
            heap: BinaryHeap::new(),
            best: HashMap::new(),
        }
    }

    pub fn insert_or_decrease_key(&mut self, key: GridPosition, value: f64) {
        match self.best.get(&key).copied() {
            Some(old) if value >= old => {}
            _ => {
                self.best.insert(key, value);
                self.heap.push(Entry { key, value });
            }
        }
    }

    fn discard_stale_top(&mut self) {
        while let Some(top) = self.heap.peek().copied() {
            match self.best.get(&top.key).copied() {
                Some(best_value) if best_value.to_bits() == top.value.to_bits() => break,
                _ => {
                    self.heap.pop();
                }
            }
        }
    }

    pub fn extract_min(&mut self) -> Option<(GridPosition, f64)> {
        self.discard_stale_top();
        let entry = self.heap.pop()?;
        self.best.remove(&entry.key);
        Some((entry.key, entry.value))
    }
}
