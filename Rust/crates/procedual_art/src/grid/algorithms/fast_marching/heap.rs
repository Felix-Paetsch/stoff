use rustc_hash::FxHashMap;
use std::cmp::Ordering;
use std::collections::BinaryHeap;

type GridPosition = [usize; 2];

#[derive(Debug, Clone, Copy)]
struct Entry {
    key: GridPosition,
    value: f64,
}

impl PartialEq for Entry {
    fn eq(&self, other: &Self) -> bool {
        self.key == other.key && self.value.to_bits() == other.value.to_bits()
    }
}

impl Eq for Entry {}

impl Ord for Entry {
    fn cmp(&self, other: &Self) -> Ordering {
        // Reverse for min-heap
        other
            .value
            .total_cmp(&self.value)
            .then_with(|| self.key.cmp(&other.key))
    }
}

impl PartialOrd for Entry {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

pub struct FastMarchingHeap {
    heap: BinaryHeap<Entry>,
    best: FxHashMap<GridPosition, Entry>,
}

impl FastMarchingHeap {
    pub fn new() -> Self {
        Self {
            heap: BinaryHeap::new(),
            best: FxHashMap::default(),
        }
    }

    pub fn insert_or_decrease_key(&mut self, key: GridPosition, value: f64) {
        let entry = Entry { key, value };
        match self.best.get(&key) {
            Some(old) if old.value <= value => {}
            _ => {
                self.best.insert(key, entry);
                self.heap.push(entry);
            }
        }
    }

    fn discard_stale_top(&mut self) {
        while let Some(&top) = self.heap.peek() {
            match self.best.get(&top.key) {
                Some(current) if current.value.to_bits() == top.value.to_bits() => break,
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
