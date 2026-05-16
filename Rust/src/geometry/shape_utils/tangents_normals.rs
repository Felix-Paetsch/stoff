use crate::geometry::{
    shape_trait::ShapeT,
    shape_utils::{
        appreciable::get_appreciable_line_segment,
        shape_position::{shape_position_from_descriptor, ShapePositionDescriptor},
    },
    vector::Vector,
};

pub fn shape_tangent_vector(shape: &impl ShapeT, descr: ShapePositionDescriptor) -> Option<Vector> {
    let pos = shape_position_from_descriptor(descr, shape)?;
    let l = get_appreciable_line_segment(shape, pos.start_index)?;
    Some(l.vector().normalize())
}

pub fn shape_normal_vector(shape: &impl ShapeT, descr: ShapePositionDescriptor) -> Option<Vector> {
    let pos = shape_position_from_descriptor(descr, shape)?;
    let l = get_appreciable_line_segment(shape, pos.start_index)?;
    Some(l.vector().normalize().rotate(std::f64::consts::FRAC_PI_2))
}
