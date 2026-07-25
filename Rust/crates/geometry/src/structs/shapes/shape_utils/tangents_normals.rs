use crate::{ShapePosition, ShapePositionDescriptor, ShapeT, Vector, appreciable};

pub fn tangent_vector(shape: &impl ShapeT, descr: ShapePositionDescriptor) -> Option<Vector> {
    let pos = ShapePosition::from_descriptor(descr, shape)?;
    let l = appreciable::appreciable_line_segment(shape, pos.index())?;
    Some(l.vector().normalize())
}

pub fn normal_vector(shape: &impl ShapeT, descr: ShapePositionDescriptor) -> Option<Vector> {
    let pos = ShapePosition::from_descriptor(descr, shape)?;
    let l = appreciable::appreciable_line_segment(shape, pos.index())?;
    Some(l.vector().normalize().rotate(std::f64::consts::FRAC_PI_2))
}
