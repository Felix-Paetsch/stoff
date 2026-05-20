use crate::geometry::*;

pub enum Geometry {
    Point(Vector),
    Polyline(Polyline),
    Polygon(Polygon),
}

impl Geometry {
    pub fn geometry_vec_to_vecf64(g: &[Geometry]) -> Vec<f64> {
        let mut out = Vec::new();

        for (i, geometry) in g.iter().enumerate() {
            if i > 0 {
                out.push(f64::NAN);
            }

            out.extend(Vec::<f64>::from(geometry));
        }

        out
    }

    pub fn vecf64_to_geometry_vec(v: &[f64]) -> Option<Vec<Geometry>> {
        if v.is_empty() {
            return Some(Vec::new());
        }

        let mut result = Vec::new();
        let mut start = 0usize;

        for (i, value) in v.iter().enumerate() {
            if value.is_nan() {
                if i == start {
                    return None;
                }

                let geometry = Geometry::from(&v[start..i]);
                result.push(geometry);
                start = i + 1;
            }
        }

        if start == v.len() {
            return None;
        }

        let geometry = Geometry::from(&v[start..]);
        result.push(geometry);

        Some(result)
    }

    pub fn serialize(&self) -> Vec<f64> {
        self.into()
    }

    pub fn deserialize(from: &[f64]) -> Geometry {
        Geometry::from(from)
    }
}

impl From<Vector> for Geometry {
    fn from(v: Vector) -> Self {
        Geometry::Point(v)
    }
}

impl From<Polygon> for Geometry {
    fn from(g: Polygon) -> Self {
        Geometry::Polygon(g)
    }
}

impl From<Polyline> for Geometry {
    fn from(l: Polyline) -> Self {
        Geometry::Polyline(l)
    }
}

impl From<&[f64]> for Geometry {
    fn from(values: &[f64]) -> Self {
        debug_assert!(!values.is_empty());

        let tag = values[0];

        debug_assert!(!tag.is_nan() && tag.fract() == 0.0);

        match tag as i32 {
            0 => {
                debug_assert!(values.len() == 3);
                Geometry::Point(Vector::new(values[1], values[2]))
            }
            1 => {
                debug_assert!(values.len() % 2 == 1);

                let vertices: Vec<Vector> = values[1..]
                    .chunks_exact(2)
                    .map(|chunk| Vector::new(chunk[0], chunk[1]))
                    .collect();

                Geometry::Polyline(Polyline::new(vertices))
            }
            2 => {
                debug_assert!(values.len() % 2 == 1);

                let vertices: Vec<Vector> = values[1..]
                    .chunks_exact(2)
                    .map(|chunk| Vector::new(chunk[0], chunk[1]))
                    .collect();

                Geometry::Polygon(Polygon::new(vertices))
            }
            _ => unreachable!(),
        }
    }
}

impl From<&Geometry> for Vec<f64> {
    fn from(geometry: &Geometry) -> Self {
        match geometry {
            Geometry::Point(vertex) => vec![0.0, vertex.x(), vertex.y()],
            Geometry::Polyline(polyline) => {
                let mut values = Vec::with_capacity(1 + polyline.vertices().len() * 2);
                values.push(1.0);

                for vertex in polyline.vertices() {
                    values.push(vertex.x());
                    values.push(vertex.y());
                }

                values
            }
            Geometry::Polygon(polygon) => {
                let mut values = Vec::with_capacity(1 + polygon.vertices().len() * 2);
                values.push(2.0);

                for vertex in polygon.vertices() {
                    values.push(vertex.x());
                    values.push(vertex.y());
                }

                values
            }
        }
    }
}

impl From<Geometry> for geo::Geometry {
    fn from(geometry: Geometry) -> Self {
        match geometry {
            Geometry::Point(p) => geo::Geometry::Point(Vector::into(p)),
            Geometry::Polyline(l) => geo::Geometry::LineString(Polyline::into(l)),
            Geometry::Polygon(g) => geo::Geometry::Polygon(Polygon::into(g)),
        }
    }
}
