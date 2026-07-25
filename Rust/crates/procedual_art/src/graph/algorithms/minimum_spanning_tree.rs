use geometry::{Shape, ShapeT, Vector};
use petgraph::algo::min_spanning_tree;
use petgraph::data::{Element, FromElements};
use petgraph::{Graph, Undirected};

use crate::graph::algorithms::delaunay::delaunay_triangulation;
use petgraph::graph::EdgeIndex;

pub fn min_spanning_tree_on_shape_graph(
    g: &Graph<Vector, Shape, Undirected>,
) -> Graph<Vector, Shape, Undirected> {
    let mut edge_weights = vec![0.0; g.edge_count()];

    for edge_idx in g.edge_indices() {
        edge_weights[edge_idx.index()] = g[edge_idx].length();
    }

    let weighted: Graph<Vector, f64, Undirected> = g.map(
        |_, node| *node,
        |edge_idx: EdgeIndex, _| edge_weights[edge_idx.index()],
    );

    let mst_weighted: Graph<Vector, f64, Undirected> =
        Graph::from_elements(min_spanning_tree(&weighted));

    let mut mst = Graph::new_undirected();

    for node in mst_weighted.node_weights() {
        mst.add_node(*node);
    }

    for edge_idx in mst_weighted.edge_indices() {
        let (a, b) = mst_weighted.edge_endpoints(edge_idx).unwrap();
        let shape = g
            .find_edge(
                petgraph::graph::NodeIndex::new(a.index()),
                petgraph::graph::NodeIndex::new(b.index()),
            )
            .map(|edge| g[edge].clone_to_shape())
            .expect("MST edge must exist in the source graph");

        mst.add_edge(a, b, shape);
    }

    mst
}

pub fn min_spanning_tree_on_shape_graph_edge_list(
    g: &Graph<Vector, Shape, Undirected>,
) -> Vec<[usize; 2]> {
    let mut edge_weights = vec![0.0; g.edge_count()];

    for edge_idx in g.edge_indices() {
        edge_weights[edge_idx.index()] = g[edge_idx].length();
    }

    let weighted: Graph<(), f64, Undirected> = g.map(
        |_, _| (),
        |edge_idx: EdgeIndex, _| edge_weights[edge_idx.index()],
    );

    min_spanning_tree(&weighted)
        .skip(g.node_count())
        .map(|element| match element {
            Element::Node { .. } => unreachable!(),
            Element::Edge { source, target, .. } => [source, target],
        })
        .collect()
}

pub fn min_spanning_tree_on_vertex_graph<T: Clone>(
    g: &Graph<Vector, T, Undirected>,
) -> Graph<Vector, T, Undirected> {
    let mut edge_weights = vec![0.0; g.edge_count()];

    for edge_idx in g.edge_indices() {
        let (a, b) = g.edge_endpoints(edge_idx).unwrap();
        edge_weights[edge_idx.index()] = g[a].distance(g[b]);
    }

    let weighted: Graph<Vector, f64, Undirected> = g.map(
        |_, node| *node,
        |edge_idx: EdgeIndex, _| edge_weights[edge_idx.index()],
    );

    let mst_weighted: Graph<Vector, f64, Undirected> =
        Graph::from_elements(min_spanning_tree(&weighted));

    let mut mst = Graph::new_undirected();

    for node in mst_weighted.node_weights() {
        mst.add_node(*node);
    }

    for edge_idx in mst_weighted.edge_indices() {
        let (a, b) = mst_weighted.edge_endpoints(edge_idx).unwrap();

        let original_edge = g
            .find_edge(
                petgraph::graph::NodeIndex::new(a.index()),
                petgraph::graph::NodeIndex::new(b.index()),
            )
            .expect("MST edge must exist in the source graph");

        mst.add_edge(a, b, g[original_edge].clone());
    }

    mst
}

pub fn min_spanning_tree_on_vertex_graph_edge_list<T: Clone>(
    g: &Graph<Vector, T, Undirected>,
) -> Vec<[usize; 2]> {
    let mut edge_weights = vec![0.0; g.edge_count()];

    for edge_idx in g.edge_indices() {
        let (a, b) = g.edge_endpoints(edge_idx).unwrap();
        edge_weights[edge_idx.index()] = g[a].distance(g[b]);
    }

    let weighted: Graph<(), f64, Undirected> = g.map(
        |_, _| (),
        |edge_idx: EdgeIndex, _| edge_weights[edge_idx.index()],
    );

    min_spanning_tree(&weighted)
        .skip(g.node_count())
        .map(|element| match element {
            Element::Node { .. } => unreachable!(),
            Element::Edge { source, target, .. } => [source, target],
        })
        .collect()
}

pub fn min_spanning_tree_from_vertices(v: &[Vector]) -> Graph<Vector, (), Undirected> {
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

pub fn min_spanning_tree_from_vertices_edge_list(v: &[Vector]) -> Vec<[usize; 2]> {
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
