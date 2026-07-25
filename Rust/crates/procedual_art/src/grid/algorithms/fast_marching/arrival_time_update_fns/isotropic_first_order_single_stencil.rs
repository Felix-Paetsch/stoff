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
    debug_assert!(w > 0 && h > 0);

    let [_, _, domain_width, domain_height] = speed_grid.domain_dimensions();

    let dx = domain_width / (w as f64 - 1.0);
    let dy = domain_height / (h as f64 - 1.0);

    move |data: &FastMarchingState, p: GridPosition| {
        let old_time = *data.times_grid.value_at(p);
        let speed = *speed_grid.value_at(p);

        if speed <= 0.0 || !speed.is_finite() {
            return old_time;
        }

        let tx_minus = if p[0] == 0 {
            f64::INFINITY
        } else {
            let pos = [p[0] - 1, p[1]];

            if data.status_grid.is_known(pos) {
                *data.times_grid.value_at(pos)
            } else {
                f64::INFINITY
            }
        };

        let tx_plus = if p[0] + 1 >= w {
            f64::INFINITY
        } else {
            let pos = [p[0] + 1, p[1]];

            if data.status_grid.is_known(pos) {
                *data.times_grid.value_at(pos)
            } else {
                f64::INFINITY
            }
        };

        let ty_minus = if p[1] == 0 {
            f64::INFINITY
        } else {
            let pos = [p[0], p[1] - 1];

            if data.status_grid.is_known(pos) {
                *data.times_grid.value_at(pos)
            } else {
                f64::INFINITY
            }
        };

        let ty_plus = if p[1] + 1 >= h {
            f64::INFINITY
        } else {
            let pos = [p[0], p[1] + 1];

            if data.status_grid.is_known(pos) {
                *data.times_grid.value_at(pos)
            } else {
                f64::INFINITY
            }
        };

        let a = tx_minus.min(tx_plus);
        let b = ty_minus.min(ty_plus);

        let candidate = match (a.is_finite(), b.is_finite()) {
            (false, false) => f64::INFINITY,

            (true, false) => {
                if dx.is_finite() {
                    a + dx / speed
                } else {
                    f64::INFINITY
                }
            }

            (false, true) => {
                if dy.is_finite() {
                    b + dy / speed
                } else {
                    f64::INFINITY
                }
            }

            (true, true) => {
                let dx2 = dx * dx;
                let dy2 = dy * dy;
                let rhs = 1.0 / (speed * speed);

                let difference = a - b;
                let discriminant = dx2 * dy2 * ((dx2 + dy2) * rhs - difference * difference);

                if discriminant >= 0.0 {
                    let t = (a * dy2 + b * dx2 + discriminant.sqrt()) / (dx2 + dy2);

                    if t >= a && t >= b {
                        t
                    } else {
                        (a + dx / speed).min(b + dy / speed)
                    }
                } else {
                    (a + dx / speed).min(b + dy / speed)
                }
            }
        };

        old_time.min(candidate)
    }
}
