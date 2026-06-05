use core::f64;

use crate::{
    geometry::Vector,
    grid::{
        algorithms::fast_marching::initialize::FastMarchingState,
        grid_struct::{Grid, GridPosition},
    },
};

type Offset = [i32; 2];

struct Stencil {
    offsets: [Offset; 4],

    relative_angle: f64,
    lengths: [f64; 2],
}

struct StencilTimes {
    left: f64,
    right: f64,
    up: f64,
    down: f64,
    far_left: f64,
    far_right: f64,
    far_up: f64,
    far_down: f64,
}

impl Stencil {
    fn compute_updated_arrival_time(
        &self,
        p: GridPosition,
        marching_state: &FastMarchingState,
        speed_grid: &Grid<f64>,
    ) -> f64 {
        let st = self.stencil_times(p, marching_state);
        let curr = *marching_state.times_grid.value_at(p);

        let middle = *marching_state.times_grid.value_at(p);
        let middle_speed = *speed_grid.value_at(p);

        curr.min(Corner::calculate_arrival_time(Corner {
            left: st.left,
            up: st.up,
            far_left: st.far_left,
            far_up: st.far_up,
            distances: self.lengths,
            relative_angle: self.relative_angle,
            middle,
            middle_speed,
        }))
        .min(Corner::calculate_arrival_time(Corner {
            left: st.right,
            up: st.up,
            far_left: st.far_right,
            far_up: st.far_up,
            distances: self.lengths,
            relative_angle: f64::consts::PI * 2.0 - self.relative_angle,
            middle,
            middle_speed,
        }))
        .min(Corner::calculate_arrival_time(Corner {
            left: st.left,
            up: st.down,
            far_left: st.far_left,
            far_up: st.far_down,
            distances: self.lengths,
            relative_angle: f64::consts::PI * 2.0 - self.relative_angle,
            middle,
            middle_speed,
        }))
        .min(Corner::calculate_arrival_time(Corner {
            left: st.right,
            up: st.down,
            far_left: st.far_right,
            far_up: st.far_down,
            distances: self.lengths,
            relative_angle: self.relative_angle,
            middle,
            middle_speed,
        }))
    }

    fn stencil_times(&self, p: GridPosition, state: &FastMarchingState) -> StencilTimes {
        StencilTimes {
            left: self
                .try_resolve_position(p, self.offsets[0], state)
                .map(|v| *state.times_grid.value_at(v))
                .unwrap_or(f64::INFINITY),
            up: self
                .try_resolve_position(p, self.offsets[1], state)
                .map(|v| *state.times_grid.value_at(v))
                .unwrap_or(f64::INFINITY),
            right: self
                .try_resolve_position(p, self.offsets[2], state)
                .map(|v| *state.times_grid.value_at(v))
                .unwrap_or(f64::INFINITY),
            down: self
                .try_resolve_position(p, self.offsets[3], state)
                .map(|v| *state.times_grid.value_at(v))
                .unwrap_or(f64::INFINITY),
            far_left: self
                .try_resolve_position(p, [self.offsets[0][0] * 2, self.offsets[0][1] * 2], state)
                .map(|v| *state.times_grid.value_at(v))
                .unwrap_or(f64::INFINITY),
            far_up: self
                .try_resolve_position(p, [self.offsets[1][0] * 2, self.offsets[1][1] * 2], state)
                .map(|v| *state.times_grid.value_at(v))
                .unwrap_or(f64::INFINITY),
            far_right: self
                .try_resolve_position(p, [self.offsets[2][0] * 2, self.offsets[2][1] * 2], state)
                .map(|v| *state.times_grid.value_at(v))
                .unwrap_or(f64::INFINITY),
            far_down: self
                .try_resolve_position(p, [self.offsets[3][0] * 2, self.offsets[3][1] * 2], state)
                .map(|v| *state.times_grid.value_at(v))
                .unwrap_or(f64::INFINITY),
        }
    }

    fn try_resolve_position(
        &self,
        origin: GridPosition,
        offset: [i32; 2],
        state: &FastMarchingState,
    ) -> Option<GridPosition> {
        let [w, h] = state.times_grid.lattice_dimensions();

        let nx = origin[0] as i32 + offset[0];
        let ny = origin[1] as i32 + offset[1];
        if nx < 0 || ny < 0 || nx >= w as i32 || ny >= h as i32 {
            return None;
        }

        let offset_pos: GridPosition = [
            ((origin[0] as i32) + offset[0]) as usize,
            ((origin[1] as i32) + offset[1]) as usize,
        ];

        if !state.status_grid.is_known(offset_pos) {
            None
        } else {
            Some(offset_pos)
        }
    }
}

struct Corner {
    middle: f64,
    middle_speed: f64,
    left: f64,
    up: f64,
    far_left: f64,
    far_up: f64,

    distances: [f64; 2],
    relative_angle: f64,
}

impl Corner {
    // Calculate 1st/second order arrival time and if that doesnt work (for now?) both default axis times
    fn calculate_arrival_time(self) -> f64 {
        // The math only slightly differs from first order

        if self.middle < self.left {
            return self.up_one_dimensional_arrival_time();
        } else if self.left <= self.far_left {
            return self.first_order_arrival_time();
        }

        if self.middle < self.up {
            return self.left_one_dimensional_arrival_time();
        } else if self.up <= self.far_up {
            return self.first_order_arrival_time();
        }

        let t_left = (4.0 * self.left - self.far_left) / 3.0;
        let t_up = (4.0 * self.up - self.far_up) / 3.0;

        // U_1^2 - 2U_1U_2 cos phi + U_2^2 = sin phi^2 / F^2
        // U_i = T(x) - T_i / ||x - x_i||
        //
        // let w = delty x
        // let h = delta y
        // let A = sin phi ^2 / F(x) ^2 * 2/3

        let cos_phi = self.relative_angle.cos();
        let sin_phi = self.relative_angle.sin();

        let [w, h] = self.distances;
        let abc_a = w * w - 2.0 * w * h * cos_phi + h * h;
        let abc_b = -2.0 * (t_left * h * h - t_up * w * w + w * h * cos_phi * (t_up + t_left));
        let aa = sin_phi * sin_phi / (self.middle_speed * self.middle_speed) * 4.0 / 9.0;
        let abc_c = h * h * t_left * t_left + w * w * t_up * t_up
            - aa * h * h * w * w
            - 2.0 * w * h * t_up * t_left;

        let p_half = 0.5 * abc_b / abc_a;
        let q = abc_c / abc_a;

        let rad = p_half * p_half - q;
        if rad <= 0.0 {
            return f64::INFINITY;
        }

        let pred_t = -p_half + rad.sqrt();
        if pred_t > self.left.max(self.up) {
            pred_t
        } else {
            f64::INFINITY
        }
    }

    fn first_order_arrival_time(&self) -> f64 {
        // Following
        // https://ieeexplore.ieee.org/stamp/stamp.jsp?tp=&arnumber=4288158

        if self.middle < self.left {
            return self.up_one_dimensional_arrival_time();
        }

        if self.middle < self.up {
            return self.left_one_dimensional_arrival_time();
        }

        // U_1^2 - 2U_1U_2 cos phi + U_2^2 = sin phi^2 / F^2
        // U_i = T(x) - T_i / ||x - x_i||
        //
        // let w = delty x
        // let h = delta y
        // let A = sin phi ^2 / F(x) ^2

        let cos_phi = self.relative_angle.cos();
        let sin_phi = self.relative_angle.sin();

        let [w, h] = self.distances;
        let abc_a = w * w - 2.0 * w * h * cos_phi + h * h;
        let abc_b =
            -2.0 * (self.left * h * h - self.up * w * w + w * h * cos_phi * (self.up + self.left));
        let aa = sin_phi * sin_phi / (self.middle_speed * self.middle_speed);
        let abc_c = h * h * self.left * self.left + w * w * self.up * self.up
            - aa * h * h * w * w
            - 2.0 * w * h * self.up * self.left;

        let p_half = 0.5 * abc_b / abc_a;
        let q = abc_c / abc_a;

        let rad = p_half * p_half - q;
        if rad <= 0.0 {
            return f64::INFINITY;
        }

        let pred_t = -p_half + rad.sqrt();
        if pred_t > self.left.max(self.up) {
            pred_t
        } else {
            f64::INFINITY
        }
    }

    fn left_one_dimensional_arrival_time(&self) -> f64 {
        self.left + self.distances[0] / self.middle_speed
    }

    fn up_one_dimensional_arrival_time(&self) -> f64 {
        self.up + self.distances[1] / self.middle_speed
    }
}

#[allow(unused)]
pub fn multi_stencil_second_order_arrival_time_update_fn<'a>(
    speed_grid: &'a Grid<f64>,
) -> impl Fn(&FastMarchingState, GridPosition) -> f64 + 'a {
    let [w, h] = speed_grid.lattice_dimensions();
    debug_assert!(w > 2 && h > 2);

    let v_middle_abs = speed_grid.vector_at([0, 0]);
    let v_left = v_middle_abs.subtract(speed_grid.vector_at([1, 0]));
    let v_up = v_middle_abs.subtract(speed_grid.vector_at([0, 1]));
    let v_diag = v_left.add(v_up);

    let stencils = [
        Stencil {
            offsets: [[-1, 0], [0, -1], [1, 0], [0, 1]],

            relative_angle: f64::consts::FRAC_PI_2,
            lengths: [v_left.length(), v_up.length()],
        },
        Stencil {
            offsets: [[-1, -1], [1, -1], [1, 1], [-1, 1]],
            relative_angle: Vector::angle(v_left, v_up),
            lengths: [v_diag.length(), v_diag.length()],
        },
    ];

    move |data: &FastMarchingState, p: GridPosition| {
        debug_assert!(data.times_grid.same_dimensions(speed_grid));

        stencils[0]
            .compute_updated_arrival_time(p, data, speed_grid)
            .min(stencils[1].compute_updated_arrival_time(p, data, speed_grid))
    }
}
