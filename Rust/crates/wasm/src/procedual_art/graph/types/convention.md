In the .new methods we expect the following args:

node_count: usize OR nodes: Vec<N>
edge_indices: Vec<usize>
edge_weights: Vec<E> OR <nothing>

An edge from n to k has the index
I = N * n + k or N*k + n

// As usizes are large the duplicated dont really matter and this makes things a lot easier than having no gaps
