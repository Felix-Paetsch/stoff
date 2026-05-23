use std::collections::{HashMap, HashSet};

use crate::{
    geometry::{LineSegment, Polygon, Polyline, Shape, Vector},
    grid::grid_struct::Grid,
};

pub enum ContourLinePositions {
    Integer,
    Value(f64),
    Values(Vec<f64>),
}

/// Map from a quantized segment start point to all segments that start there.
type SegmentsMap = HashMap<(u64, u64), Vec<LineSegment>>;

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

    fn is_boundary_key(self, (x, y): (u64, u64)) -> bool {
        x == 0 || x == Self::MAX_KEY || y == 0 || y == Self::MAX_KEY
    }
}

pub fn marching_squares(grid: &Grid<f64>, z: ContourLinePositions) -> Vec<Shape> {
    let [grid_w, grid_h] = grid.grid_dimensions();

    if grid_w < 2 || grid_h < 2 {
        return Vec::new();
    }

    let levels = contour_levels(grid, z);
    match levels.len() {
        0 => Vec::new(),
        1 => marching_squares_single(grid, levels[0]),
        _ => marching_squares_multi(grid, &levels),
    }
}

fn contour_levels(grid: &Grid<f64>, z: ContourLinePositions) -> Vec<f64> {
    match z {
        ContourLinePositions::Value(v) => {
            if v.is_finite() {
                vec![v]
            } else {
                Vec::new()
            }
        }
        ContourLinePositions::Values(mut values) => {
            values.retain(|v| v.is_finite());
            values.sort_by(|a, b| a.partial_cmp(b).unwrap());
            values.dedup_by(|a, b| *a == *b);
            values
        }
        ContourLinePositions::Integer => {
            let mut min_v = f64::INFINITY;
            let mut max_v = f64::NEG_INFINITY;

            for &v in grid.iter() {
                if v.is_finite() {
                    min_v = min_v.min(v);
                    max_v = max_v.max(v);
                }
            }

            if !min_v.is_finite() || !max_v.is_finite() {
                return Vec::new();
            }

            let start = min_v.ceil();
            let end = max_v.floor();

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

            (start as i64..=end as i64).map(|v| v as f64).collect()
        }
    }
}

fn marching_squares_single(grid: &Grid<f64>, z: f64) -> Vec<Shape> {
    let [grid_x, grid_y, world_w, world_h] = grid.dimensions();
    let [w, h] = grid.grid_dimensions();

    let step_x = if w > 1 { world_w / (w - 1) as f64 } else { 0.0 };
    let step_y = if h > 1 { world_h / (h - 1) as f64 } else { 0.0 };

    let quantizer = Quantizer::new([grid_x, grid_y, world_w, world_h]);
    let mut segments: SegmentsMap = HashMap::new();

    let mut add_seg = |start: Vector, end: Vector| {
        let key = quantizer.key(start);
        segments
            .entry(key)
            .or_default()
            .push(LineSegment { start, end });
    };

    let mut current_row = (0..w).map(|x| *grid.value_at(x, 0)).collect::<Vec<_>>();
    let mut next_row = Vec::with_capacity(w);

    for y in 0..(h - 1) {
        next_row.clear();
        next_row.push(*grid.value_at(0, y + 1));

        let y0 = grid_y + y as f64 * step_y;
        let y1 = grid_y + (y + 1) as f64 * step_y;

        for x in 0..(w - 1) {
            let ulz = current_row[x];
            let urz = current_row[x + 1];
            let blz = next_row[x];
            let brz = *grid.value_at(x + 1, y + 1);

            next_row.push(brz);

            if !(ulz.is_finite() && urz.is_finite() && blz.is_finite() && brz.is_finite()) {
                continue;
            }

            let x0 = grid_x + x as f64 * step_x;
            let x1 = grid_x + (x + 1) as f64 * step_x;

            emit_cell_segments(z, ulz, urz, blz, brz, x0, x1, y0, y1, &mut add_seg);
        }

        std::mem::swap(&mut current_row, &mut next_row);
    }

    build_contours(segments, quantizer)
}

fn marching_squares_multi(grid: &Grid<f64>, levels: &[f64]) -> Vec<Shape> {
    let [grid_x, grid_y, world_w, world_h] = grid.dimensions();
    let [w, h] = grid.grid_dimensions();

    let step_x = if w > 1 { world_w / (w - 1) as f64 } else { 0.0 };
    let step_y = if h > 1 { world_h / (h - 1) as f64 } else { 0.0 };

    let quantizer = Quantizer::new([grid_x, grid_y, world_w, world_h]);
    let mut per_level_segments: MultiLevelSegmentsMap =
        (0..levels.len()).map(|_| HashMap::new()).collect();

    let mut current_row = (0..w).map(|x| *grid.value_at(x, 0)).collect::<Vec<_>>();
    let mut next_row = Vec::with_capacity(w);

    for y in 0..(h - 1) {
        next_row.clear();
        next_row.push(*grid.value_at(0, y + 1));

        let y0 = grid_y + y as f64 * step_y;
        let y1 = grid_y + (y + 1) as f64 * step_y;

        for x in 0..(w - 1) {
            let ulz = current_row[x];
            let urz = current_row[x + 1];
            let blz = next_row[x];
            let brz = *grid.value_at(x + 1, y + 1);

            next_row.push(brz);

            if !(ulz.is_finite() && urz.is_finite() && blz.is_finite() && brz.is_finite()) {
                continue;
            }

            let cell_min = ulz.min(urz).min(blz).min(brz);
            let cell_max = ulz.max(urz).max(blz).max(brz);

            let start_idx = lower_bound(levels, cell_min);
            let end_idx = upper_bound(levels, cell_max);

            if start_idx >= end_idx {
                continue;
            }

            let x0 = grid_x + x as f64 * step_x;
            let x1 = grid_x + (x + 1) as f64 * step_x;

            for (level_idx, &z) in levels[start_idx..end_idx].iter().enumerate() {
                let actual_idx = start_idx + level_idx;
                let segments = &mut per_level_segments[actual_idx];

                let mut add_seg = |start: Vector, end: Vector| {
                    let key = quantizer.key(start);
                    segments
                        .entry(key)
                        .or_default()
                        .push(LineSegment { start, end });
                };

                emit_cell_segments(z, ulz, urz, blz, brz, x0, x1, y0, y1, &mut add_seg);
            }
        }

        std::mem::swap(&mut current_row, &mut next_row);
    }

    let mut out = Vec::new();
    for segments in per_level_segments {
        if !segments.is_empty() {
            out.extend(build_contours(segments, quantizer));
        }
    }

    out
}

#[allow(clippy::too_many_arguments)]
fn emit_cell_segments(
    z: f64,
    ulz: f64,
    urz: f64,
    blz: f64,
    brz: f64,
    x0: f64,
    x1: f64,
    y0: f64,
    y1: f64,
    add_seg: &mut impl FnMut(Vector, Vector),
) {
    let mut case_idx = 0;
    if blz > z {
        case_idx |= 1;
    }
    if brz > z {
        case_idx |= 2;
    }
    if urz > z {
        case_idx |= 4;
    }
    if ulz > z {
        case_idx |= 8;
    }

    if case_idx == 0 || case_idx == 15 {
        return;
    }

    let top_t = fraction(z, (ulz, urz));
    let bottom_t = fraction(z, (blz, brz));
    let left_t = fraction(z, (ulz, blz));
    let right_t = fraction(z, (urz, brz));

    let top = Vector::new(lerp(x0, x1, top_t), y0);
    let bottom = Vector::new(lerp(x0, x1, bottom_t), y1);
    let left = Vector::new(x0, lerp(y0, y1, left_t));
    let right = Vector::new(x1, lerp(y0, y1, right_t));

    match case_idx {
        0 | 15 => {}
        1 => add_seg(bottom, left),
        2 => add_seg(right, bottom),
        3 => add_seg(right, left),
        4 => add_seg(top, right),
        5 => {
            add_seg(top, left);
            add_seg(bottom, right);
        }
        6 => add_seg(top, bottom),
        7 => add_seg(top, left),
        8 => add_seg(left, top),
        9 => add_seg(bottom, top),
        10 => {
            add_seg(left, bottom);
            add_seg(right, top);
        }
        11 => add_seg(right, top),
        12 => add_seg(left, right),
        13 => add_seg(bottom, right),
        14 => add_seg(left, bottom),
        _ => unreachable!(),
    }
}

fn build_contours(mut segments: SegmentsMap, quantizer: Quantizer) -> Vec<Shape> {
    let mut shapes = Vec::new();

    let mut boundary_keys = segments
        .keys()
        .copied()
        .filter(|&k| quantizer.is_boundary_key(k))
        .collect::<HashSet<_>>();

    while !segments.is_empty() {
        let first_key = boundary_keys
            .iter()
            .next()
            .copied()
            .unwrap_or_else(|| *segments.keys().next().unwrap());

        let first_segment = {
            let bucket = segments.get_mut(&first_key).unwrap();
            let seg = bucket.pop().unwrap();
            let empty = bucket.is_empty();
            (seg, empty)
        };

        if first_segment.1 {
            segments.remove(&first_key);
            boundary_keys.remove(&first_key);
        }

        let mut contour = vec![first_segment.0.start, first_segment.0.end];

        loop {
            let prev = *contour.last().unwrap();
            let prev_key = quantizer.key(prev);

            let next_segment = {
                let Some(bucket) = segments.get_mut(&prev_key) else {
                    break;
                };

                let best_idx = bucket
                    .iter()
                    .enumerate()
                    .min_by(|(_, a), (_, b)| {
                        let da = a.start.distance_squared(prev);
                        let db = b.start.distance_squared(prev);
                        da.partial_cmp(&db).unwrap()
                    })
                    .map(|(i, _)| i);

                let Some(idx) = best_idx else {
                    break;
                };

                let seg = bucket.swap_remove(idx);
                let empty = bucket.is_empty();
                Some((seg, empty))
            };

            let Some((ls, bucket_empty)) = next_segment else {
                break;
            };

            if bucket_empty {
                segments.remove(&prev_key);
                boundary_keys.remove(&prev_key);
            }

            contour.push(ls.end);

            if contour[0].approx_equals(ls.end) {
                break;
            }
        }

        if contour.len() >= 2 {
            let is_polygon = contour[0].approx_equals(*contour.last().unwrap());

            if is_polygon {
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
    }

    shapes.into_iter().map(|s| s.into_simplified()).collect()
}

fn lower_bound(values: &[f64], target: f64) -> usize {
    let mut left = 0;
    let mut right = values.len();

    while left < right {
        let mid = left + (right - left) / 2;
        if values[mid] < target {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    left
}

fn upper_bound(values: &[f64], target: f64) -> usize {
    let mut left = 0;
    let mut right = values.len();

    while left < right {
        let mid = left + (right - left) / 2;
        if values[mid] <= target {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    left
}

fn fraction(z: f64, (z0, z1): (f64, f64)) -> f64 {
    if z0 == z1 {
        return 0.5;
    }

    let t = (z - z0) / (z1 - z0);
    t.clamp(0.0, 1.0)
}

fn lerp(a: f64, b: f64, t: f64) -> f64 {
    a + (b - a) * t
}
