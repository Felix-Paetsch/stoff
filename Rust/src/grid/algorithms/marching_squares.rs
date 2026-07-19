use std::collections::HashMap;

use crate::{
    geometry::{Polygon, Polyline, Shape, Vector, algorithms::simplify::into_simplified_shape},
    grid::grid_struct::Grid,
};

pub enum ContourLinePositions {
    Integer,
    Value(f64),
    Values(Vec<f64>),
}

/// Map from a quantized segment start point to all segments that start there.
type SegmentsMap = HashMap<(u64, u64), Vec<IndexedSegment>>;

/// Segments kept separate per contour level.
type MultiLevelSegmentsMap = Vec<SegmentsMap>;

#[derive(Clone, Copy)]
struct Quantizer {
    min_x: f64,
    min_y: f64,
    inv_w: f64,
    inv_h: f64,
}

impl Quantizer {
    const MAX_KEY: u64 = u32::MAX as u64;

    fn new([x, y, w, h]: [f64; 4]) -> Self {
        Self {
            min_x: x,
            min_y: y,
            inv_w: if w == 0.0 { 0.0 } else { 1.0 / w },
            inv_h: if h == 0.0 { 0.0 } else { 1.0 / h },
        }
    }

    #[inline]
    fn key(self, v: Vector) -> (u64, u64) {
        let nx = if self.inv_w == 0.0 {
            0.0
        } else {
            ((v.x() - self.min_x) * self.inv_w).clamp(0.0, 1.0)
        };

        let ny = if self.inv_h == 0.0 {
            0.0
        } else {
            ((v.y() - self.min_y) * self.inv_h).clamp(0.0, 1.0)
        };

        let qx = (nx * Self::MAX_KEY as f64).round() as u64;
        let qy = (ny * Self::MAX_KEY as f64).round() as u64;

        (qx, qy)
    }

    #[inline]
    fn is_boundary_key(self, (x, y): (u64, u64)) -> bool {
        x == 0 || x == Self::MAX_KEY || y == 0 || y == Self::MAX_KEY
    }
}

#[derive(Clone, Copy)]
struct IndexedSegment {
    start: Vector,
    end: Vector,
    // start_key: (u64, u64),
    end_key: (u64, u64),
}

pub fn marching_squares(grid: &Grid<f64>, positions: ContourLinePositions) -> Vec<Shape> {
    let [grid_w, grid_h] = grid.lattice_dimensions();

    if grid_w < 2 || grid_h < 2 {
        return Vec::new();
    }

    let levels = contour_levels(grid, positions);

    match levels.len() {
        0 => Vec::new(),
        1 => marching_squares_single(grid, levels[0]),
        _ => marching_squares_multi(grid, &levels),
    }
}

fn contour_levels(grid: &Grid<f64>, positions: ContourLinePositions) -> Vec<f64> {
    match positions {
        ContourLinePositions::Value(value) => {
            if value.is_finite() {
                vec![value]
            } else {
                Vec::new()
            }
        }

        ContourLinePositions::Values(mut values) => {
            values.retain(|value| value.is_finite());

            values.sort_by(|a, b| a.partial_cmp(b).unwrap());
            values.dedup_by(|a, b| *a == *b);

            values
        }

        ContourLinePositions::Integer => {
            const MAX_INTEGER_LEVELS: i64 = 100_000;

            let mut min_value = f64::INFINITY;
            let mut max_value = f64::NEG_INFINITY;

            for &value in grid.iter() {
                if value.is_finite() {
                    min_value = min_value.min(value);
                    max_value = max_value.max(value);
                }
            }

            if !min_value.is_finite() || !max_value.is_finite() {
                return Vec::new();
            }

            let start = min_value.ceil();
            let end = max_value.floor();

            if start > end {
                return Vec::new();
            }

            if start < i64::MIN as f64 || end > i64::MAX as f64 {
                debug_assert!(
                    false,
                    "integer contour range is too large to materialize safely"
                );
                return Vec::new();
            }

            let start = start as i64;
            let end = end as i64;

            let Some(count) = end.checked_sub(start).and_then(|v| v.checked_add(1)) else {
                return Vec::new();
            };

            if count > MAX_INTEGER_LEVELS {
                debug_assert!(false, "too many integer contour levels requested");
                return Vec::new();
            }

            (start..=end).map(|value| value as f64).collect()
        }
    }
}

fn marching_squares_single(grid: &Grid<f64>, level: f64) -> Vec<Shape> {
    let [grid_x, grid_y, world_w, world_h] = grid.domain_dimensions();
    let [width, height] = grid.lattice_dimensions();

    let step_x = world_w / (width - 1) as f64;
    let step_y = world_h / (height - 1) as f64;

    let quantizer = Quantizer::new([grid_x, grid_y, world_w, world_h]);
    let mut segments = SegmentsMap::new();

    let mut current_row = (0..width)
        .map(|x| *grid.value_at([x, 0]))
        .collect::<Vec<_>>();

    let mut next_row = Vec::with_capacity(width);

    for y in 0..height - 1 {
        next_row.clear();
        next_row.push(*grid.value_at([0, y + 1]));

        let y0 = grid_y + y as f64 * step_y;
        let y1 = grid_y + (y + 1) as f64 * step_y;

        for x in 0..width - 1 {
            let ulz = current_row[x];
            let urz = current_row[x + 1];
            let blz = next_row[x];
            let brz = *grid.value_at([x + 1, y + 1]);

            next_row.push(brz);

            if !(ulz.is_finite() && urz.is_finite() && blz.is_finite() && brz.is_finite()) {
                continue;
            }

            let x0 = grid_x + x as f64 * step_x;
            let x1 = grid_x + (x + 1) as f64 * step_x;

            emit_cell_segments(
                level,
                ulz,
                urz,
                blz,
                brz,
                x0,
                x1,
                y0,
                y1,
                &mut |start, end| {
                    insert_segment(&mut segments, quantizer, start, end);
                },
            );
        }

        std::mem::swap(&mut current_row, &mut next_row);
    }

    build_contours(segments, quantizer)
}

fn marching_squares_multi(grid: &Grid<f64>, levels: &[f64]) -> Vec<Shape> {
    let [grid_x, grid_y, world_w, world_h] = grid.domain_dimensions();
    let [width, height] = grid.lattice_dimensions();

    let step_x = world_w / (width - 1) as f64;
    let step_y = world_h / (height - 1) as f64;

    let quantizer = Quantizer::new([grid_x, grid_y, world_w, world_h]);

    let mut per_level_segments: MultiLevelSegmentsMap =
        (0..levels.len()).map(|_| HashMap::new()).collect();

    let mut current_row = (0..width)
        .map(|x| *grid.value_at([x, 0]))
        .collect::<Vec<_>>();

    let mut next_row = Vec::with_capacity(width);

    for y in 0..height - 1 {
        next_row.clear();
        next_row.push(*grid.value_at([0, y + 1]));

        let y0 = grid_y + y as f64 * step_y;
        let y1 = grid_y + (y + 1) as f64 * step_y;

        for x in 0..width - 1 {
            let ulz = current_row[x];
            let urz = current_row[x + 1];
            let blz = next_row[x];
            let brz = *grid.value_at([x + 1, y + 1]);

            next_row.push(brz);

            if !(ulz.is_finite() && urz.is_finite() && blz.is_finite() && brz.is_finite()) {
                continue;
            }

            let cell_min = ulz.min(urz).min(blz).min(brz);
            let cell_max = ulz.max(urz).max(blz).max(brz);

            let first_level = lower_bound(levels, cell_min);
            let end_level = upper_bound(levels, cell_max);

            if first_level >= end_level {
                continue;
            }

            let x0 = grid_x + x as f64 * step_x;
            let x1 = grid_x + (x + 1) as f64 * step_x;

            for level_index in first_level..end_level {
                let level = levels[level_index];
                let segments = &mut per_level_segments[level_index];

                emit_cell_segments(
                    level,
                    ulz,
                    urz,
                    blz,
                    brz,
                    x0,
                    x1,
                    y0,
                    y1,
                    &mut |start, end| {
                        insert_segment(segments, quantizer, start, end);
                    },
                );
            }
        }

        std::mem::swap(&mut current_row, &mut next_row);
    }

    let mut output = Vec::new();

    for segments in per_level_segments {
        if !segments.is_empty() {
            output.extend(build_contours(segments, quantizer));
        }
    }

    output
}

fn insert_segment(segments: &mut SegmentsMap, quantizer: Quantizer, start: Vector, end: Vector) {
    let start_key = quantizer.key(start);
    let end_key = quantizer.key(end);

    segments.entry(start_key).or_default().push(IndexedSegment {
        start,
        end,
        // start_key,
        end_key,
    });
}

#[allow(clippy::too_many_arguments)]
fn emit_cell_segments(
    level: f64,
    ulz: f64,
    urz: f64,
    blz: f64,
    brz: f64,
    x0: f64,
    x1: f64,
    y0: f64,
    y1: f64,
    add_segment: &mut impl FnMut(Vector, Vector),
) {
    let mut case_index = 0;

    if blz > level {
        case_index |= 1;
    }

    if brz > level {
        case_index |= 2;
    }

    if urz > level {
        case_index |= 4;
    }

    if ulz > level {
        case_index |= 8;
    }

    if case_index == 0 || case_index == 15 {
        return;
    }

    let top = || Vector::new(lerp(x0, x1, fraction(level, (ulz, urz))), y0);

    let bottom = || Vector::new(lerp(x0, x1, fraction(level, (blz, brz))), y1);

    let left = || Vector::new(x0, lerp(y0, y1, fraction(level, (ulz, blz))));

    let right = || Vector::new(x1, lerp(y0, y1, fraction(level, (urz, brz))));

    match case_index {
        1 => add_segment(bottom(), left()),

        2 => add_segment(right(), bottom()),

        3 => add_segment(right(), left()),

        4 => add_segment(top(), right()),

        5 => {
            add_segment(top(), left());
            add_segment(bottom(), right());
        }

        6 => add_segment(top(), bottom()),

        7 => add_segment(top(), left()),

        8 => add_segment(left(), top()),

        9 => add_segment(bottom(), top()),

        10 => {
            add_segment(left(), bottom());
            add_segment(right(), top());
        }

        11 => add_segment(right(), top()),

        12 => add_segment(left(), right()),

        13 => add_segment(bottom(), right()),

        14 => add_segment(left(), bottom()),

        0 | 15 => {}

        _ => unreachable!(),
    }
}

fn build_contours(mut segments: SegmentsMap, quantizer: Quantizer) -> Vec<Shape> {
    let mut shapes = Vec::new();

    while !segments.is_empty() {
        let first_key = find_contour_start_key(&segments, quantizer);

        let first_segment = {
            let bucket = segments
                .get_mut(&first_key)
                .expect("segment start key must exist");

            let segment = bucket.pop().expect("segment bucket must not be empty");
            let bucket_empty = bucket.is_empty();

            (segment, bucket_empty)
        };

        if first_segment.1 {
            segments.remove(&first_key);
        }

        let first = first_segment.0;

        let mut contour = Vec::with_capacity(16);
        contour.push(first.start);
        contour.push(first.end);

        let mut current_key = first.end_key;
        let mut previous_point = first.end;

        loop {
            let Some(bucket) = segments.get_mut(&current_key) else {
                break;
            };

            let segment = if bucket.len() == 1 {
                bucket.pop().unwrap()
            } else {
                // This is only needed when multiple geometrically close
                // endpoints quantize to the same key.
                let index = bucket
                    .iter()
                    .enumerate()
                    .min_by(|(_, a), (_, b)| {
                        let distance_a = a.start.distance_squared(previous_point);
                        let distance_b = b.start.distance_squared(previous_point);

                        distance_a.partial_cmp(&distance_b).unwrap()
                    })
                    .map(|(index, _)| index)
                    .unwrap();

                bucket.swap_remove(index)
            };

            let bucket_empty = bucket.is_empty();

            if bucket_empty {
                segments.remove(&current_key);
            }

            contour.push(segment.end);
            previous_point = segment.end;
            current_key = segment.end_key;

            if contour[0].approx_equals(segment.end) {
                break;
            }
        }

        if contour.len() < 2 {
            continue;
        }

        let is_closed = contour[0].approx_equals(*contour.last().unwrap());

        if is_closed {
            contour.pop();

            if contour.len() >= 3 {
                shapes.push(Shape::Polygon(Polygon::new(contour)));
            } else {
                shapes.push(Shape::Polyline(Polyline::new(contour)));
            }
        } else {
            shapes.push(Shape::Polyline(Polyline::new(contour)));
        }
    }

    shapes.into_iter().map(into_simplified_shape).collect()
}

fn find_contour_start_key(segments: &SegmentsMap, quantizer: Quantizer) -> (u64, u64) {
    segments
        .keys()
        .copied()
        .find(|&key| quantizer.is_boundary_key(key))
        .unwrap_or_else(|| *segments.keys().next().expect("segments must not be empty"))
}

#[inline]
fn lower_bound(values: &[f64], target: f64) -> usize {
    let mut left = 0;
    let mut right = values.len();

    while left < right {
        let middle = left + (right - left) / 2;

        if values[middle] < target {
            left = middle + 1;
        } else {
            right = middle;
        }
    }

    left
}

#[inline]
fn upper_bound(values: &[f64], target: f64) -> usize {
    let mut left = 0;
    let mut right = values.len();

    while left < right {
        let middle = left + (right - left) / 2;

        if values[middle] <= target {
            left = middle + 1;
        } else {
            right = middle;
        }
    }

    left
}

#[inline]
fn fraction(level: f64, values: (f64, f64)) -> f64 {
    let (value_a, value_b) = values;

    if value_a == value_b {
        return 0.5;
    }

    ((level - value_a) / (value_b - value_a)).clamp(0.0, 1.0)
}

#[inline]
fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}
