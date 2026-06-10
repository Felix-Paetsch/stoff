use crate::grid::grid_struct::{Grid, GridPosition};
use itertools::Itertools;

pub struct GridWindow<'a, T> {
    pub grid: &'a Grid<T>,
    pub anchor: GridPosition,
    pub width: usize,
    pub height: usize,
}

impl<'a, T> GridWindow<'a, T> {
    pub fn get(&self, pos: GridPosition) -> &'a T {
        self.grid
            .value_at([pos[0] + self.anchor[0], pos[1] + self.anchor[1]])
    }
}

impl<T> Grid<T> {
    pub fn iter_windows(
        &self,
        window_width: usize,
        window_height: usize,
    ) -> impl Iterator<Item = GridWindow<'_, T>> {
        let [w, h] = self.lattice_dimensions();

        debug_assert!(
            window_width > 0 && window_height > 0 && window_width <= w && window_height <= h
        );

        let prod_it = (0..w - window_width + 1).cartesian_product(0..h - window_height + 1);
        prod_it.map(move |(i, j)| GridWindow {
            grid: self,
            anchor: [i, j],
            width: window_width,
            height: window_height,
        })
    }

    pub fn iter_chunks(
        &self,
        window_width: usize,
        window_height: usize,
    ) -> impl Iterator<Item = GridWindow<'_, T>> {
        let [w, h] = self.lattice_dimensions();

        debug_assert!(
            window_width > 0 && window_height > 0 && window_width <= w && window_height <= h
        );

        let skipped_left = (w % window_width) / 2;
        let skipped_right = (w - skipped_left) % window_width;
        let skipped_up = (h % window_height) / 2;
        let skipped_down = (h - skipped_up) % window_height;

        let prod_it = (skipped_left..w - skipped_right)
            .step_by(window_width)
            .cartesian_product((skipped_up..h - skipped_down).step_by(window_height));

        prod_it.map(move |(i, j)| GridWindow {
            grid: self,
            anchor: [i, j],
            width: window_width,
            height: window_height,
        })
    }

    pub fn map_windows<U, F>(&self, window_width: usize, window_height: usize, f: F) -> Grid<U>
    where
        F: FnMut(GridWindow<T>) -> U,
    {
        let [w, h] = self.lattice_dimensions();
        let [x0, y0, dx, dy] = self.domain_dimensions();
        debug_assert!(
            window_width > 0 && window_height > 0 && window_width <= w && window_height <= h
        );

        let grid_values: Vec<U> = self
            .iter_windows(window_width, window_height)
            .map(f)
            .collect();

        let unit_width = dx / (w as f64 - 1.0);
        let unit_height = dy / (h as f64 - 1.0);

        let x_offset = (window_width - 1) as f64 * unit_width / 2.0;
        let y_offset = (window_height - 1) as f64 * unit_height / 2.0;

        Grid::new(
            [
                x0 + x_offset,
                y0 + y_offset,
                dx - 2.0 * x_offset,
                dy - 2.0 * y_offset,
            ],
            [w - window_width + 1, h - window_height + 1],
            grid_values,
        )
    }

    pub fn map_chunks<U, F>(&self, window_width: usize, window_height: usize, f: F) -> Grid<U>
    where
        F: FnMut(GridWindow<T>) -> U,
    {
        let [w, h] = self.lattice_dimensions();
        let [x0, y0, dx, dy] = self.domain_dimensions();
        debug_assert!(
            window_width > 0 && window_height > 0 && window_width <= w && window_height <= h
        );

        let grid_values: Vec<U> = self
            .iter_chunks(window_width, window_height)
            .map(f)
            .collect();

        let unit_width = dx / (w as f64 - 1.0);
        let unit_height = dy / (h as f64 - 1.0);

        let x_overage = w % window_width;
        let y_overage = h % window_height;

        let skipped_left = x_overage / 2;
        let skipped_up = y_overage / 2;

        let new_lattice_width = w / window_width;
        let new_lattice_height = h / window_height;

        let new_domain_width = (w - x_overage - 1) as f64 * unit_width;
        let new_domain_height = (h - y_overage - 1) as f64 * unit_height;

        Grid::new(
            [
                x0 + unit_width * skipped_left as f64,
                y0 + unit_height * skipped_up as f64,
                new_domain_width,
                new_domain_height,
            ],
            [new_lattice_width, new_lattice_height],
            grid_values,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn map_windows_domain_dimensions_size() {
        // Domain dimension corners should be at the center of their windows
        let grid = Grid::new([-2.0, -4.0, 4.0, 8.0], [3, 5], vec![(); 3 * 5]);
        let itered_grid = grid.map_windows(2, 3, |_| ());
        let [x, y, w, h] = itered_grid.domain_dimensions();

        assert_eq!(x, -1.0);
        assert_eq!(w, 2.0);
        assert_eq!(y, -2.0);
        assert_eq!(h, 4.0);

        let grid = Grid::new([0.0, 0.0, 24.0, 30.0], [5, 6], vec![(); 5 * 6]);
        let itered_grid = grid.map_windows(3, 3, |_| ());
        let [x, y, w, h] = itered_grid.domain_dimensions();

        assert_eq!(x, 6.0);
        assert_eq!(w, 12.0);
        assert_eq!(y, 6.0);
        assert_eq!(h, 24.0 - 6.0);
    }

    #[test]
    fn map_windows_lattice_dimensions_size() {
        let grid = Grid::new([-2.0, -4.0, 4.0, 8.0], [3, 5], vec![(); 3 * 5]);
        let itered_grid = grid.map_windows(2, 3, |_| ());
        let [w, h] = itered_grid.lattice_dimensions();

        assert_eq!(w, 2);
        assert_eq!(h, 3);

        let grid = Grid::new([0.0, 0.0, 24.0, 30.0], [5, 6], vec![(); 5 * 6]);
        let itered_grid = grid.map_windows(3, 3, |_| ());
        let [w, h] = itered_grid.lattice_dimensions();

        assert_eq!(w, 3);
        assert_eq!(h, 4);
    }

    #[test]
    fn map_chunks_domain_dimensions_size() {
        // Domain dimension corners should be at the center of their windows
        let grid = Grid::new([-3.0, -5.0, 6.0, 10.0], [4, 6], vec![(); 4 * 6]);
        let itered_grid = grid.map_chunks(2, 3, |_| ());
        let [x, y, w, h] = itered_grid.domain_dimensions();

        assert_eq!(x, -3.0);
        assert_eq!(w, 6.0);
        assert_eq!(y, -5.0);
        assert_eq!(h, 10.0);

        let grid = Grid::new([0.0, 0.0, 24.0, 35.0], [9, 8], vec![(); 9 * 8]);
        let itered_grid = grid.map_chunks(3, 3, |_| ());
        let [x, y, w, h] = itered_grid.domain_dimensions();

        assert_eq!(x, 0.0);
        assert_eq!(w, 24.0);
        assert_eq!(y, 5.0);
        assert_eq!(h, 25.0);
    }

    #[test]
    fn map_chunks_lattice_dimensions_size() {
        let grid = Grid::new([-3.0, -5.0, 6.0, 10.0], [4, 6], vec![(); 4 * 6]);
        let itered_grid = grid.map_chunks(2, 3, |_| ());
        let [w, h] = itered_grid.lattice_dimensions();

        assert_eq!(w, 2);
        assert_eq!(h, 2);

        let grid = Grid::new([0.0, 0.0, 24.0, 35.0], [9, 8], vec![(); 9 * 8]);
        let itered_grid = grid.map_chunks(3, 3, |_| ());
        let [w, h] = itered_grid.lattice_dimensions();

        assert_eq!(w, 3);
        assert_eq!(h, 2);
    }
}
