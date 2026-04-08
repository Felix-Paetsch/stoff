use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn buffer(shapes: Vec<Vec<f64>>, distance: number) -> Option<Vec<f64>> {
    let ls = vecf64_to_linestring(polygon).unwrap();
    let polygon = Polygon::new(ls, vec![]);

    polygon.interior_point().map(|c: Point| vec![c.x(), c.y()])
}
