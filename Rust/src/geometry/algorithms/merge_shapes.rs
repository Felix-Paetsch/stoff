mod double_run;
mod shared;
mod single_run;
mod wasm;

#[allow(unused)]
pub use self::single_run::index::{ShapeMergingConfig, merge_shapes, merge_shapes_advanced};
#[allow(unused)]
pub use self::single_run::types::ShapeEndpoint;

#[allow(unused)]
pub use self::double_run::index::{
    DoubleRunShapeMergingConfig, double_run_merge_shapes, double_run_merge_shapes_advanced,
};
