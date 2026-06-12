use crate::{geometry::Vector, grid::grid_lerp::Lerp, numerics::eps::EPS_ABS};

pub type GridPosition = [usize; 2];

pub struct Grid<T> {
    domain_dimensions: [f64; 4], // x_tl, y_tl, width, height || both x and y increase downwards
    lattice_dimensions: [usize; 2], // w, h || expected to go from extreme outer left to extreme outer right
    values: Vec<T>,
}

impl<T> Grid<T> {
    pub fn new(
        domain_dimensions: [f64; 4],
        lattice_dimensions: [usize; 2],
        values: Vec<T>,
    ) -> Self {
        let [w, h] = lattice_dimensions;

        debug_assert!(
            domain_dimensions[2].is_finite() && domain_dimensions[3].is_finite(),
            "grid width/height must be finite"
        );
        debug_assert!(
            domain_dimensions[2] >= 0.0,
            "grid width must be non-negative"
        );
        debug_assert!(
            domain_dimensions[3] >= 0.0,
            "grid height must be non-negative"
        );

        debug_assert!(w > 1, "grid lattice width must be > 1");
        debug_assert!(h > 1, "grid lattice height must be > 1");

        debug_assert!(
            values.len() == w * h,
            "values length must equal width * height"
        );

        Self {
            domain_dimensions,
            lattice_dimensions,
            values,
        }
    }

    #[inline]
    pub fn grid_position_to_index(&self, p: GridPosition) -> usize {
        debug_assert!(p[1] < self.lattice_dimensions[1]);
        debug_assert!(p[0] < self.lattice_dimensions[0]);

        p[1] * self.lattice_dimensions[0] + p[0]
    }

    #[allow(unused)]
    pub fn set_value_at(&mut self, p: GridPosition, value: T) {
        let w = self.lattice_dimensions[0];
        let idx = self.grid_position_to_index(p);
        self.values[idx] = value;
    }

    pub fn value_at(&self, p: GridPosition) -> &T {
        let idx = self.grid_position_to_index(p);
        &self.values[idx]
    }

    #[allow(unused)]
    pub fn value_at_mut(&mut self, p: GridPosition) -> &T {
        let idx = self.grid_position_to_index(p);
        &mut self.values[idx]
    }

    pub fn vector_at(&self, p: GridPosition) -> Vector {
        let x = self.domain_dimensions[0]
            + (p[0] as f64) * self.domain_dimensions[2] / (self.lattice_dimensions[0] as f64);
        let y = self.domain_dimensions[1]
            + (p[1] as f64) * self.domain_dimensions[3] / (self.lattice_dimensions[1] as f64);

        Vector::new(x, y)
    }

    #[allow(unused)]
    pub fn map<U, F>(&self, mut f: F) -> Grid<U>
    where
        F: FnMut(GridPosition, &T) -> U,
    {
        let w = self.lattice_dimensions[0];

        let values = self
            .values
            .iter()
            .enumerate()
            .map(|(i, v)| {
                let x = i % w;
                let y = i / w;
                f([x, y], v)
            })
            .collect();

        Grid {
            domain_dimensions: self.domain_dimensions,
            lattice_dimensions: self.lattice_dimensions,
            values,
        }
    }

    #[allow(unused)]
    pub fn map_in_place<F>(&mut self, mut f: F)
    where
        F: FnMut(&mut T),
    {
        for value in &mut self.values {
            f(value);
        }
    }

    pub fn domain_dimensions(&self) -> [f64; 4] {
        self.domain_dimensions
    }

    pub fn lattice_dimensions(&self) -> [usize; 2] {
        self.lattice_dimensions
    }

    pub fn iter(&self) -> std::slice::Iter<'_, T> {
        self.values.iter()
    }

    #[inline]
    #[allow(unused)]
    pub fn adjacent_positions(&self, p: GridPosition) -> impl Iterator<Item = GridPosition> {
        let [w, h] = self.lattice_dimensions;

        [
            (p[0] > 0).then(|| [p[0] - 1, p[1]]),     // left
            (p[0] < w - 1).then(|| [p[0] + 1, p[1]]), // right
            (p[1] > 0).then(|| [p[0], p[1] - 1]),     // up
            (p[1] < h - 1).then(|| [p[0], p[1] + 1]), // down
        ]
        .into_iter()
        .flatten()
    }

    #[inline]
    pub fn adjacent_positions8(&self, p: GridPosition) -> impl Iterator<Item = GridPosition> {
        let [w, h] = self.lattice_dimensions;

        [
            // Cross (4-way)
            (p[0] > 0).then(|| [p[0] - 1, p[1]]),     // left
            (p[0] < w - 1).then(|| [p[0] + 1, p[1]]), // right
            (p[1] > 0).then(|| [p[0], p[1] - 1]),     // up
            (p[1] < h - 1).then(|| [p[0], p[1] + 1]), // down
            // Diagonals
            (p[0] > 0 && p[1] > 0).then(|| [p[0] - 1, p[1] - 1]),
            (p[0] > 0 && p[1] < h - 1).then(|| [p[0] - 1, p[1] + 1]),
            (p[0] < w - 1 && p[1] > 0).then(|| [p[0] + 1, p[1] - 1]),
            (p[0] < w - 1 && p[1] < h - 1).then(|| [p[0] + 1, p[1] + 1]),
        ]
        .into_iter()
        .flatten()
    }

    #[allow(unused)]
    pub fn iter_mut(&mut self) -> std::slice::IterMut<'_, T> {
        self.values.iter_mut()
    }

    pub fn into_values(self) -> Vec<T> {
        self.values
    }

    pub fn into_parts(self) -> ([f64; 4], [usize; 2], Vec<T>) {
        (self.domain_dimensions, self.lattice_dimensions, self.values)
    }

    #[allow(unused)]
    pub fn into_values_2d(self) -> Vec<Vec<T>> {
        let [w, h] = self.lattice_dimensions;
        let mut values = self.values.into_iter();
        let mut rows = Vec::with_capacity(h);

        for _ in 0..h {
            rows.push(values.by_ref().take(w).collect());
        }

        rows
    }

    #[allow(unused)]
    pub fn into_subgrid(self, subbox: [usize; 4]) -> Grid<T> {
        let [x, y, w, h] = subbox;
        let [grid_w, grid_h] = self.lattice_dimensions;

        debug_assert!(x <= grid_w, "subgrid x out of bounds");
        debug_assert!(y <= grid_h, "subgrid y out of bounds");
        debug_assert!(x + w <= grid_w, "subgrid width out of bounds");
        debug_assert!(y + h <= grid_h, "subgrid height out of bounds");

        let mut values = Vec::with_capacity(w * h);

        let mut values_2d = self.values.into_iter().collect::<Vec<_>>();

        for row in y..(y + h) {
            let start = row * grid_w + x;
            let end = start + w;
            values.extend(values_2d.drain(start..end));
        }

        Grid {
            domain_dimensions: self.domain_dimensions,
            lattice_dimensions: [w, h],
            values,
        }
    }

    #[allow(unused)]
    pub fn into_remap_domain(self, new_domain: [f64; 4]) -> Grid<T> {
        Grid {
            domain_dimensions: new_domain,
            lattice_dimensions: self.lattice_dimensions,
            values: self.values,
        }
    }

    pub fn into_transposed(self) -> Grid<T> {
        todo!();
    }

    pub fn same_dimensions<S>(&self, other: &Grid<S>) -> bool {
        self.lattice_dimensions[0] == other.lattice_dimensions[0]
            && self.lattice_dimensions[1] == other.lattice_dimensions[1]
            && (self.domain_dimensions[0] - other.domain_dimensions[0]).abs() < EPS_ABS
            && (self.domain_dimensions[1] - other.domain_dimensions[1]).abs() < EPS_ABS
            && (self.domain_dimensions[2] - other.domain_dimensions[2]).abs() < EPS_ABS
            && (self.domain_dimensions[3] - other.domain_dimensions[3]).abs() < EPS_ABS
    }
}

impl<T> Grid<T>
where
    T: Copy,
{
    #[allow(unused)]
    pub fn remap_domain(&self, new_domain: [f64; 4]) -> Grid<T> {
        Grid {
            domain_dimensions: new_domain,
            lattice_dimensions: self.lattice_dimensions,
            values: self.values.clone(),
        }
    }

    #[allow(unused)]
    pub fn subgrid(&self, subbox: [usize; 4]) -> Grid<T> {
        let [x, y, w, h] = subbox;
        let [grid_w, grid_h] = self.lattice_dimensions;

        debug_assert!(x <= grid_w, "subgrid x out of bounds");
        debug_assert!(y <= grid_h, "subgrid y out of bounds");
        debug_assert!(x + w <= grid_w, "subgrid width out of bounds");
        debug_assert!(y + h <= grid_h, "subgrid height out of bounds");

        let mut values: Vec<T> = Vec::with_capacity(w * h);

        for row in y..(y + h) {
            for col in x..(x + w) {
                values.push(*self.value_at([col, row]));
            }
        }

        Grid {
            domain_dimensions: self.domain_dimensions,
            lattice_dimensions: [w, h],
            values,
        }
    }

    pub fn transpose(&self) -> Grid<T> {
        todo!();
    }
}

impl<T> Grid<T>
where
    T: Lerp + Copy,
{
    #[allow(unused)]
    pub fn sample_at(&self, v: Vector) -> T {
        let [grid_x, grid_y, grid_w, grid_h] = self.domain_dimensions;
        let [w, h] = self.lattice_dimensions;
        let [x, y] = v.into_array();

        debug_assert!(
            grid_w >= 0.0,
            "grid width in world space must be non-negative"
        );
        debug_assert!(
            grid_h >= 0.0,
            "grid height in world space must be non-negative"
        );
        debug_assert!(
            x >= grid_x && x <= grid_x + grid_w,
            "x is outside grid bounds"
        );
        debug_assert!(
            y >= grid_y && y <= grid_y + grid_h,
            "y is outside grid bounds"
        );

        let nx = if grid_w == 0.0 {
            0.0
        } else {
            (x - grid_x) / grid_w
        };

        let ny = if grid_h == 0.0 {
            0.0
        } else {
            (y - grid_y) / grid_h
        };

        let sx = nx * (w.saturating_sub(1) as f64);
        let sy = ny * (h.saturating_sub(1) as f64);

        let x0 = sx.floor() as usize;
        let y0 = sy.floor() as usize;
        let x1 = (x0 + 1).min(w - 1);
        let y1 = (y0 + 1).min(h - 1);

        let tx = sx - x0 as f64;
        let ty = sy - y0 as f64;

        let v00 = *self.value_at([x0, y0]);
        let v10 = *self.value_at([x1, y0]);
        let v01 = *self.value_at([x0, y1]);
        let v11 = *self.value_at([x1, y1]);

        let a = T::lerp(v00, v10, tx);
        let b = T::lerp(v01, v11, tx);

        T::lerp(a, b, ty)
    }

    #[allow(unused)]
    pub fn resample(&self, new_dimensions: [f64; 4], new_sample_spacing: [usize; 2]) -> Grid<T> {
        let [new_w, new_h] = new_sample_spacing;
        debug_assert!(new_w > 0, "new sample width must be > 0");
        debug_assert!(new_h > 0, "new sample height must be > 0");

        let [x, y, w, h] = new_dimensions;
        let mut values = Vec::with_capacity(new_w * new_h);

        for j in 0..new_h {
            let fy = if new_h == 1 {
                0.0
            } else {
                j as f64 / (new_h - 1) as f64
            };

            let abs_y = y + fy * h;

            for i in 0..new_w {
                let fx = if new_w == 1 {
                    0.0
                } else {
                    i as f64 / (new_w - 1) as f64
                };

                let abs_x = x + fx * w;
                values.push(self.sample_at(Vector::new(abs_x, abs_y)));
            }
        }

        Grid {
            domain_dimensions: new_dimensions,
            lattice_dimensions: [new_w, new_h],
            values,
        }
    }
}
