use petgraph::algo::min_spanning_tree;
use petgraph::data::{Element, FromElements};
use petgraph::{Graph, Undirected};

use crate::geometry::Vector;
use crate::graph::algorithms::delaunay::delaunay_triangulation;

use petgraph::graph::EdgeIndex;

pub fn minimum_spanning_tree_from_vertices(v: &[Vector]) -> Graph<Vector, (), Undirected> {
    let delaunay = delaunay_triangulation(v);

    let mut edge_weights = vec![0.0; delaunay.edge_count()];

    for edge_idx in delaunay.edge_indices() {
        let (a, b) = delaunay.edge_endpoints(edge_idx).unwrap();
        let va = delaunay[a];
        let vb = delaunay[b];
        edge_weights[edge_idx.index()] = va.distance(vb);
    }

    let weighted: Graph<Vector, f64, Undirected> = delaunay.map_owned(
        |_, node| node,
        |edge_idx: EdgeIndex, _| edge_weights[edge_idx.index()],
    );

    let mst_weighted: Graph<Vector, f64, Undirected> =
        Graph::from_elements(min_spanning_tree(&weighted));

    mst_weighted.map_owned(|_, node| node, |_, _| ())
}

pub fn minimum_spanning_tree_from_vertices_edge_list(v: &[Vector]) -> Vec<[usize; 2]> {
    let delaunay = delaunay_triangulation(v);

    let mut edge_weights = vec![0.0; delaunay.edge_count()];

    for edge_idx in delaunay.edge_indices() {
        let (a, b) = delaunay.edge_endpoints(edge_idx).unwrap();
        let va = delaunay[a];
        let vb = delaunay[b];
        edge_weights[edge_idx.index()] = va.distance(vb);
    }

    let weighted: Graph<(), f64, Undirected> = delaunay.map_owned(
        |_, _| (),
        |edge_idx: EdgeIndex, _| edge_weights[edge_idx.index()],
    );

    min_spanning_tree(&weighted)
        .skip(v.len())
        .map(|e| match e {
            Element::Node { weight: _ } => unreachable!(),
            Element::Edge {
                source,
                target,
                weight: _,
            } => [source, target],
        })
        .collect()
}
