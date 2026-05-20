use crate::grid::grid_lerp::Lerp;

pub struct Grid<T> {
    dimensions: [f64; 4], // x_tl, y_tl, width, height || both x and y increase downwards
    grid_dimensions: [usize; 2], // w, h || expected to go from extreme outer left to extreme outer right
    values: Vec<T>,
}

impl<T> Grid<T> {
    pub fn new(dimensions: [f64; 4], grid_dimensions: [usize; 2], values: Vec<T>) -> Self {
        let [w, h] = grid_dimensions;

        debug_assert!(
            dimensions[2].is_finite() && dimensions[3].is_finite(),
            "grid width/height must be finite"
        );
        debug_assert!(dimensions[2] >= 0.0, "grid width must be non-negative");
        debug_assert!(dimensions[3] >= 0.0, "grid height must be non-negative");

        debug_assert!(w > 0, "grid width must be > 0");
        debug_assert!(h > 0, "grid height must be > 0");

        debug_assert!(
            values.len() == w * h,
            "values length must equal width * height"
        );

        Self {
            dimensions,
            grid_dimensions,
            values,
        }
    }

    pub fn set_value_at(&mut self, x: usize, y: usize, value: T) {
        let w = self.grid_dimensions[0];
        let idx = y * w + x;
        self.values[idx] = value;
    }

    pub fn value_at(&self, x: usize, y: usize) -> &T {
        let w = self.grid_dimensions[0];

        let idx = y * w + x;
        &self.values[idx]
    }

    pub fn value_at_mut(&mut self, x: usize, y: usize) -> &T {
        let w = self.grid_dimensions[0];

        let idx = y * w + x;
        &mut self.values[idx]
    }

    pub fn map<U, F>(&self, mut f: F) -> Grid<U>
    where
        F: FnMut(usize, usize, &T) -> U,
    {
        let w = self.grid_dimensions[0];

        let values = self
            .values
            .iter()
            .enumerate()
            .map(|(i, v)| {
                let x = i % w;
                let y = i / w;
                f(x, y, v)
            })
            .collect();

        Grid {
            dimensions: self.dimensions,
            grid_dimensions: self.grid_dimensions,
            values,
        }
    }

    pub fn map_in_place<F>(&mut self, mut f: F)
    where
        F: FnMut(&mut T),
    {
        for value in &mut self.values {
            f(value);
        }
    }

    pub fn map_owned<U, F>(self, f: F) -> Grid<U>
    where
        F: FnMut(T) -> U,
    {
        let values = self.values.into_iter().map(f).collect();

        Grid {
            dimensions: self.dimensions,
            grid_dimensions: self.grid_dimensions,
            values,
        }
    }

    pub fn dimensions(&self) -> [f64; 4] {
        self.dimensions
    }

    pub fn grid_dimensions(&self) -> [usize; 2] {
        self.grid_dimensions
    }

    pub fn iter(&self) -> std::slice::Iter<'_, T> {
        self.values.iter()
    }

    pub fn iter_mut(&mut self) -> std::slice::IterMut<'_, T> {
        self.values.iter_mut()
    }

    pub fn into_values(self) -> Vec<T> {
        self.values
    }

    pub fn into_values_2d(self) -> Vec<Vec<T>> {
        let [w, h] = self.grid_dimensions;
        let mut values = self.values.into_iter();
        let mut rows = Vec::with_capacity(h);

        for _ in 0..h {
            rows.push(values.by_ref().take(w).collect());
        }

        rows
    }

    pub fn into_subgrid(self, subbox: [usize; 4]) -> Grid<T> {
        let [x, y, w, h] = subbox;
        let [grid_w, grid_h] = self.grid_dimensions;

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
            dimensions: self.dimensions,
            grid_dimensions: [w, h],
            values,
        }
    }

    pub fn into_remap_domain(self, new_domain: [f64; 4]) -> Grid<T> {
        Grid {
            dimensions: new_domain,
            grid_dimensions: self.grid_dimensions,
            values: self.values,
        }
    }
}

impl<T> Grid<T>
where
    T: Copy,
{
    pub fn remap_domain(&self, new_domain: [f64; 4]) -> Grid<T> {
        Grid {
            dimensions: new_domain,
            grid_dimensions: self.grid_dimensions,
            values: self.values.clone(),
        }
    }

    pub fn subgrid(&self, subbox: [usize; 4]) -> Grid<T> {
        let [x, y, w, h] = subbox;
        let [grid_w, grid_h] = self.grid_dimensions;

        debug_assert!(x <= grid_w, "subgrid x out of bounds");
        debug_assert!(y <= grid_h, "subgrid y out of bounds");
        debug_assert!(x + w <= grid_w, "subgrid width out of bounds");
        debug_assert!(y + h <= grid_h, "subgrid height out of bounds");

        let mut values: Vec<T> = Vec::with_capacity(w * h);

        for row in y..(y + h) {
            for col in x..(x + w) {
                values.push(*self.value_at(col, row));
            }
        }

        Grid {
            dimensions: self.dimensions,
            grid_dimensions: [w, h],
            values,
        }
    }
}

impl<T> Grid<T>
where
    T: Lerp + Copy,
{
    pub fn sample_at(&self, x: f64, y: f64) -> T {
        let [grid_x, grid_y, grid_w, grid_h] = self.dimensions;
        let [w, h] = self.grid_dimensions;

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

        let v00 = *self.value_at(x0, y0);
        let v10 = *self.value_at(x1, y0);
        let v01 = *self.value_at(x0, y1);
        let v11 = *self.value_at(x1, y1);

        let a = T::lerp(v00, v10, tx);
        let b = T::lerp(v01, v11, tx);

        T::lerp(a, b, ty)
    }

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
                values.push(self.sample_at(abs_x, abs_y));
            }
        }

        Grid {
            dimensions: new_dimensions,
            grid_dimensions: [new_w, new_h],
            values,
        }
    }
}
