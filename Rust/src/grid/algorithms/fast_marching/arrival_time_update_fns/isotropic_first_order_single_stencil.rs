// A reference is: https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=4288158
// https://ieeexplore.ieee.org/document/4288158/figures#figures

use crate::grid::{
    algorithms::fast_marching::initialize::FastMarchingState,
    grid_struct::{Grid, GridPosition},
};

#[allow(unused)]
pub fn isotropic_first_order_arrival_time_update_fn<'a>(
    speed_grid: &'a Grid<f64>,
) -> impl Fn(&FastMarchingState, GridPosition) -> f64 + 'a {
    debug_assert!(speed_grid.iter().all(|x| *x >= 0.0));

    let [w, h] = speed_grid.lattice_dimensions();
    debug_assert!(w > 2 && h > 2);

    let [_, _, domw, domh] = speed_grid.domain_dimensions();
    let dx = domw / (w as f64 - 1.0);
    let dy = domh / (h as f64 - 1.0);

    move |data: &FastMarchingState, p: GridPosition| {
        let old_t = *data.times_grid.value_at(p);
        let f = *speed_grid.value_at(p);

        if f <= 0.0 {
            return old_t;
        }

        let txm = if p[0] == 0 {
            f64::INFINITY
        } else {
            *data.times_grid.value_at([p[0] - 1, p[1]])
        };
        let txp = if p[0] + 1 >= w {
            f64::INFINITY
        } else {
            *data.times_grid.value_at([p[0] + 1, p[1]])
        };
        let a = txm.min(txp);

        let tym = if p[1] == 0 {
            f64::INFINITY
        } else {
            *data.times_grid.value_at([p[0], p[1] - 1])
        };
        let typ = if p[1] + 1 >= h {
            f64::INFINITY
        } else {
            *data.times_grid.value_at([p[0], p[1] + 1])
        };
        let b = tym.min(typ);

        let candidate = match (a.is_finite(), b.is_finite()) {
            (false, false) => f64::INFINITY,
            (true, false) => a + dx / f,
            (false, true) => b + dy / f,
            (true, true) => {
                let dx2 = dx * dx;
                let dy2 = dy * dy;

                let discr = dx2 * dy2 * ((dx2 + dy2) / (f * f) - (a - b) * (a - b));

                if discr >= 0.0 {
                    let t_quad = (a * dy2 + b * dx2 + discr.sqrt()) / (dx2 + dy2);

                    if t_quad >= a && t_quad >= b {
                        t_quad
                    } else {
                        (a + dx / f).min(b + dy / f)
                    }
                } else {
                    (a + dx / f).min(b + dy / f)
                }
            }
        };

        old_t.min(candidate)
    }
}
