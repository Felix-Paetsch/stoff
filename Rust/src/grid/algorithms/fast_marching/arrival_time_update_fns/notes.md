For the 2nd order single stencil approximation we may want to have in numerics a "QuadraticEqn" struct with utils, to reduce cases.

.solve: Option<[min_sol, max_sol]>
.solve_with_tolerance: Option<[min_sol, max_sol]> (if there might be single sol)
.closest_zeros: Option<[min_sol, max_sol]> (if there might be single sol)
