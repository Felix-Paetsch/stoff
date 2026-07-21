mod double_run;
mod shared;
mod single_run;

#[allow(unused)]
pub use double_run::index::{
    DoubleRunShapeMergingConfig, double_run_merge_shapes, double_run_merge_shapes_advanced,
};
pub use shared::ShapeEndpoint;
#[allow(unused)]
pub use single_run::index::{ShapeMergingConfig, merge_shapes, merge_shapes_advanced};
