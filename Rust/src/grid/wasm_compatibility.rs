use crate::{geometry::Vector, grid::grid_struct::Grid};

pub enum WASMTransmittableGridValues {
    Float(Vec<f64>),
    Vector(Vec<Vector>),
    Vec3(Vec<[f64; 3]>),
    Boolean(Vec<bool>),
}

pub struct WASMTransmittableGrid {
    dimensions: [f64; 4],
    grid_dimensions: [usize; 2],
    values: WASMTransmittableGridValues,
}

impl WASMTransmittableGrid {
    #[allow(unused)]
    pub fn serialize(&self) -> Vec<f64> {
        let value_type = match &self.values {
            WASMTransmittableGridValues::Vector(_) => 0.0,
            WASMTransmittableGridValues::Float(_) => 1.0,
            WASMTransmittableGridValues::Boolean(_) => 2.0,
            WASMTransmittableGridValues::Vec3(_) => 3.0,
        };

        let mut out: Vec<f64> = Vec::new();
        out.push(value_type);
        out.extend_from_slice(&self.dimensions);

        out.extend([
            self.grid_dimensions[0] as f64,
            self.grid_dimensions[1] as f64,
        ]);

        match &self.values {
            WASMTransmittableGridValues::Float(nodes) => {
                out.extend(nodes);
            }
            WASMTransmittableGridValues::Vector(nodes) => {
                let vertex_data: Vec<f64> = nodes.iter().flat_map(|v| [v.x(), v.y()]).collect();
                out.extend(vertex_data);
            }
            WASMTransmittableGridValues::Boolean(nodes) => {
                let vertex_data: Vec<f64> =
                    nodes.iter().map(|v| if *v { 1.0 } else { 0.0 }).collect();
                out.extend(vertex_data);
            }
            WASMTransmittableGridValues::Vec3(nodes) => {
                let vertex_data: Vec<f64> = nodes.iter().copied().flatten().collect();
                out.extend(vertex_data);
            }
        }

        out
    }

    #[allow(unused)]
    pub fn into_serialized(self) -> Vec<f64> {
        let value_type = match self.values {
            WASMTransmittableGridValues::Vector(_) => 0.0,
            WASMTransmittableGridValues::Float(_) => 1.0,
            WASMTransmittableGridValues::Boolean(_) => 2.0,
            WASMTransmittableGridValues::Vec3(_) => 3.0,
        };

        let mut out: Vec<f64> = Vec::new();
        out.push(value_type);
        out.extend(self.dimensions);

        out.extend([
            self.grid_dimensions[0] as f64,
            self.grid_dimensions[1] as f64,
        ]);

        match self.values {
            WASMTransmittableGridValues::Float(nodes) => {
                out.extend(nodes);
            }
            WASMTransmittableGridValues::Vector(nodes) => {
                let vertex_data: Vec<f64> =
                    nodes.into_iter().flat_map(|v| [v.x(), v.y()]).collect();
                out.extend(vertex_data);
            }
            WASMTransmittableGridValues::Boolean(nodes) => {
                let vertex_data: Vec<f64> = nodes
                    .into_iter()
                    .map(|v| if v { 1.0 } else { 0.0 })
                    .collect();
                out.extend(vertex_data);
            }
            WASMTransmittableGridValues::Vec3(nodes) => {
                let vertex_data: Vec<f64> = nodes.into_iter().flatten().collect();
                out.extend(vertex_data);
            }
        }

        out
    }

    #[allow(unused)]
    pub fn deserialize(data: &[f64]) -> Self {
        debug_assert!(data.len() >= 7, "input too short");

        let value_type = data[0];
        let dimensions = [data[1], data[2], data[3], data[4]];

        let w = data[5];
        let h = data[6];

        debug_assert!(w.is_finite() && h.is_finite(), "grid dimensions not finite");
        debug_assert!(w >= 0.0 && h >= 0.0, "grid dimensions negative");

        let grid_dimensions = [w as usize, h as usize];
        let values_data = &data[7..];

        let values = if value_type == 0.0 {
            let mut nodes = Vec::with_capacity(values_data.len() / 2);

            for chunk in values_data.chunks_exact(2) {
                nodes.push(Vector::new(chunk[0], chunk[1]));
            }

            WASMTransmittableGridValues::Vector(nodes)
        } else if value_type == 1.0 {
            WASMTransmittableGridValues::Float(values_data.to_vec())
        } else if value_type == 2.0 {
            WASMTransmittableGridValues::Boolean(values_data.iter().map(|v| *v == 1.0).collect())
        } else {
            WASMTransmittableGridValues::Vec3(values_data.as_chunks::<3>().0.to_vec())
        };

        Self {
            dimensions,
            grid_dimensions,
            values,
        }
    }

    #[allow(unused)]
    pub fn into_deserialized(mut data: Vec<f64>) -> Self {
        debug_assert!(data.len() >= 7, "input too short");

        let value_type = data[0];
        let dimensions = [data[1], data[2], data[3], data[4]];

        let w = data[5];
        let h = data[6];

        debug_assert!(w.is_finite() && h.is_finite(), "grid dimensions not finite");
        debug_assert!(w >= 0.0 && h >= 0.0, "grid dimensions negative");

        let grid_dimensions = [w as usize, h as usize];
        let values_data: Vec<_> = data.drain(7..).collect();

        let values = if value_type == 0.0 {
            let mut nodes = Vec::with_capacity(values_data.len() / 2);

            for chunk in values_data.chunks_exact(2) {
                nodes.push(Vector::new(chunk[0], chunk[1]));
            }

            WASMTransmittableGridValues::Vector(nodes)
        } else if value_type == 1.0 {
            WASMTransmittableGridValues::Float(values_data)
        } else if value_type == 2.0 {
            WASMTransmittableGridValues::Boolean(
                values_data.into_iter().map(|v| v == 1.0).collect(),
            )
        } else {
            WASMTransmittableGridValues::Vec3(values_data.as_chunks::<3>().0.to_vec())
        };

        Self {
            dimensions,
            grid_dimensions,
            values,
        }
    }
}

impl From<WASMTransmittableGrid> for Grid<f64> {
    fn from(g: WASMTransmittableGrid) -> Self {
        match g.values {
            WASMTransmittableGridValues::Float(values) => {
                Grid::new(g.dimensions, g.grid_dimensions, values)
            }
            _ => unreachable!(),
        }
    }
}

impl From<WASMTransmittableGrid> for Grid<Vector> {
    fn from(g: WASMTransmittableGrid) -> Self {
        match g.values {
            WASMTransmittableGridValues::Vector(values) => {
                Grid::new(g.dimensions, g.grid_dimensions, values)
            }
            _ => unreachable!(),
        }
    }
}

impl From<Grid<Vector>> for WASMTransmittableGrid {
    fn from(g: Grid<Vector>) -> Self {
        WASMTransmittableGrid {
            dimensions: g.domain_dimensions(),
            grid_dimensions: g.lattice_dimensions(),
            values: WASMTransmittableGridValues::Vector(g.into_values()),
        }
    }
}

impl From<Grid<f64>> for WASMTransmittableGrid {
    fn from(g: Grid<f64>) -> Self {
        WASMTransmittableGrid {
            dimensions: g.domain_dimensions(),
            grid_dimensions: g.lattice_dimensions(),
            values: WASMTransmittableGridValues::Float(g.into_values()),
        }
    }
}
