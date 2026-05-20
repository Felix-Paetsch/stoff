use crate::geometry::{appreciable, ShapePosition, ShapePositionDescriptor, ShapeT, Vector};

#[allow(dead_code)]
pub fn shape_tangent_vector(shape: &impl ShapeT, descr: ShapePositionDescriptor) -> Option<Vector> {
    let pos = ShapePosition::from_descriptor(descr, shape)?;
    let l = appreciable::appreciable_line_segment(shape, pos.index())?;
    Some(l.vector().normalize())
}

#[allow(dead_code)]
pub fn shape_normal_vector(shape: &impl ShapeT, descr: ShapePositionDescriptor) -> Option<Vector> {
    let pos = ShapePosition::from_descriptor(descr, shape)?;
    let l = appreciable::appreciable_line_segment(shape, pos.index())?;
    Some(l.vector().normalize().rotate(std::f64::consts::FRAC_PI_2))
}
