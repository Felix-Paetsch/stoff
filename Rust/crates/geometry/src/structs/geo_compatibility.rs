use geo::{Coord, CoordsIter};

use crate::{Geometry, Polygon, Polyline, ShapeT, Vector};

#[allow(unused)]
pub(crate) enum VectorSlice<'a> {
    Polygon(&'a [Vector]),
    Polyline(&'a [Vector]),
    Raw(&'a [Vector]),
}

#[allow(unused)]
impl<'a> VectorSlice<'a> {
    fn from_shape<'b>(shape: &'b impl ShapeT) -> VectorSlice<'b> {
        if shape.is_polygon() {
            VectorSlice::Polygon(shape.vertices())
        } else {
            VectorSlice::Polyline(shape.vertices())
        }
    }

    fn inner(&self) -> &'_ [Vector] {
        match &self {
            VectorSlice::Polyline(l) => l,
            VectorSlice::Polygon(g) => g,
            VectorSlice::Raw(r) => r,
        }
    }

    fn into_inner(self) -> &'a [Vector] {
        match &self {
            VectorSlice::Polyline(l) => l,
            VectorSlice::Polygon(g) => g,
            VectorSlice::Raw(r) => r,
        }
    }

    fn into_raw_slice(self) -> VectorSlice<'a> {
        VectorSlice::Raw(self.into_inner())
    }
}

impl CoordsIter for VectorSlice<'_> {
    type Iter<'a>
        = Box<dyn Iterator<Item = Coord<f64>> + 'a>
    where
        Self: 'a;

    type ExteriorIter<'a>
        = Box<dyn Iterator<Item = Coord<f64>> + 'a>
    where
        Self: 'a;

    type Scalar = f64;

    fn coords_iter(&self) -> Self::Iter<'_> {
        Box::new(self.inner().iter().map(|v| (*v).into()))
    }

    fn exterior_coords_iter(&self) -> Self::ExteriorIter<'_> {
        Box::new(self.inner().iter().map(|v| (*v).into()))
    }

    fn coords_count(&self) -> usize {
        self.inner().len()
    }
}

// ShapeT

pub(crate) fn copy_shape_into_geo_polygon(s: &impl ShapeT) -> geo::Polygon {
    geo::Polygon::new(copy_shape_into_geo_linestring(s), vec![])
}

pub(crate) fn copy_shape_into_geo_linestring(s: &impl ShapeT) -> geo::LineString {
    geo::LineString::from_iter(s.vertices().iter().map(|v| Coord::from(*v)))
}

// Gon / Line

impl From<Polygon> for geo::Polygon {
    fn from(poly: Polygon) -> geo::Polygon {
        let polyline = poly.into_polyline();
        let exterior: geo::LineString = polyline.into();
        geo::Polygon::new(exterior, vec![])
    }
}

impl From<geo::Polygon> for Polygon {
    fn from(poly: geo::Polygon) -> Polygon {
        let (outer, _) = poly.into_inner();
        let polyline = Polyline::from(outer);
        polyline.into_polygon()
    }
}

impl From<Polyline> for geo::LineString {
    fn from(pl: Polyline) -> geo::LineString {
        geo::LineString::new(pl.into_vertices().into_iter().map(|v| v.into()).collect())
    }
}

impl From<geo::LineString> for Polyline {
    fn from(pl: geo::LineString) -> Polyline {
        Polyline::new(pl.coords_iter().map(Vector::from).collect())
    }
}

// Vector

impl From<Vector> for geo::Coord {
    fn from(vertex: Vector) -> Self {
        geo::Coord {
            x: vertex.x(),
            y: vertex.y(),
        }
    }
}

impl From<Vector> for geo::Point {
    fn from(vertex: Vector) -> Self {
        let coord: geo::Coord = vertex.into();
        coord.into()
    }
}

impl From<geo::Coord> for Vector {
    fn from(coord: geo::Coord) -> Self {
        Vector::new(coord.x, coord.y)
    }
}

impl From<&geo::Coord> for Vector {
    fn from(coord: &geo::Coord) -> Self {
        Vector::new(coord.x, coord.y)
    }
}

impl From<geo::Point> for Vector {
    fn from(point: geo::Point) -> Self {
        let coord = point.0;
        Vector::new(coord.x, coord.y)
    }
}

impl From<&geo::Point> for Vector {
    fn from(point: &geo::Point) -> Self {
        let coord = point.0;
        Vector::new(coord.x, coord.y)
    }
}

// Geometry

impl From<Geometry> for geo::Geometry {
    fn from(geometry: Geometry) -> Self {
        match geometry {
            Geometry::Point(p) => geo::Geometry::Point(Vector::into(p)),
            Geometry::Polyline(l) => geo::Geometry::LineString(Polyline::into(l)),
            Geometry::Polygon(g) => geo::Geometry::Polygon(Polygon::into(g)),
        }
    }
}

pub(crate) fn copy_geometry_into_geo_geometry(geometry: &Geometry) -> geo::Geometry {
    match geometry {
        Geometry::Point(p) => geo::Geometry::Point(Vector::into(*p)),
        Geometry::Polyline(l) => geo::Geometry::LineString(copy_shape_into_geo_linestring(l)),
        Geometry::Polygon(g) => geo::Geometry::Polygon(copy_shape_into_geo_polygon(g)),
    }
}
