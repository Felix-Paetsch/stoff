package three

import (
	"math"
	G "stoffgo/geometry"
)

type Shape struct {
	Vertices  []G.Vec
	Edges     [][2]int
	Triangles [][3]int
}

// Helper function to add a vertex to the shape, returning the index of the vertex
func addVertex(vertices *[]G.Vec, vertex G.Vec) int {
	*vertices = append(*vertices, vertex)
	return len(*vertices) - 1
}

// Helper function to split an edge and return the new vertex index
func middlePoint(v1, v2 int, vertices *[]G.Vec, middleCache map[[2]int]int) int {
	// Ensure vertices are ordered to prevent duplicate midpoints
	key := [2]int{v1, v2}
	if v1 > v2 {
		key[0], key[1] = v2, v1
	}

	// Check cache
	if idx, found := middleCache[key]; found {
		return idx
	}

	// Create the midpoint, normalize it to place it on the sphere
	point1 := (*vertices)[v1]
	point2 := (*vertices)[v2]
	mid := G.Interpolate(point1, point2, 0.5).Normalize()

	// Add new midpoint to vertices and cache it
	idx := addVertex(vertices, mid)
	middleCache[key] = idx

	return idx
}

// Sphere creates an icosphere with a given radius and level of detail
func IcoSphere(radius float64, recursionLevel int) Shape {
	var vertices []G.Vec
	var edges [][2]int
	var triangles [][3]int
	middleCache := make(map[[2]int]int)

	// Create the 12 vertices of an icosahedron
	t := (1.0 + math.Sqrt(5.0)) / 2.0

	vertices = append(vertices, G.Vec{-1, t, 0}.Normalize())
	vertices = append(vertices, G.Vec{1, t, 0}.Normalize())
	vertices = append(vertices, G.Vec{-1, -t, 0}.Normalize())
	vertices = append(vertices, G.Vec{1, -t, 0}.Normalize())

	vertices = append(vertices, G.Vec{0, -1, t}.Normalize())
	vertices = append(vertices, G.Vec{0, 1, t}.Normalize())
	vertices = append(vertices, G.Vec{0, -1, -t}.Normalize())
	vertices = append(vertices, G.Vec{0, 1, -t}.Normalize())

	vertices = append(vertices, G.Vec{t, 0, -1}.Normalize())
	vertices = append(vertices, G.Vec{t, 0, 1}.Normalize())
	vertices = append(vertices, G.Vec{-t, 0, -1}.Normalize())
	vertices = append(vertices, G.Vec{-t, 0, 1}.Normalize())

	// Create the 20 triangles of the icosahedron
	indices := [][3]int{
		{0, 11, 5}, {0, 5, 1}, {0, 1, 7}, {0, 7, 10}, {0, 10, 11},
		{1, 5, 9}, {5, 11, 4}, {11, 10, 2}, {10, 7, 6}, {7, 1, 8},
		{3, 9, 4}, {3, 4, 2}, {3, 2, 6}, {3, 6, 8}, {3, 8, 9},
		{4, 9, 5}, {2, 4, 11}, {6, 2, 10}, {8, 6, 7}, {9, 8, 1},
	}

	// Recursively subdivide each triangle
	for i := 0; i < recursionLevel; i++ {
		newTriangles := [][3]int{}
		for _, tri := range indices {
			// Replace triangle by 4 triangles
			a := middlePoint(tri[0], tri[1], &vertices, middleCache)
			b := middlePoint(tri[1], tri[2], &vertices, middleCache)
			c := middlePoint(tri[2], tri[0], &vertices, middleCache)

			newTriangles = append(newTriangles, [3]int{tri[0], a, c})
			newTriangles = append(newTriangles, [3]int{tri[1], b, a})
			newTriangles = append(newTriangles, [3]int{tri[2], c, b})
			newTriangles = append(newTriangles, [3]int{a, b, c})
		}
		indices = newTriangles
	}

	// Adjust the vertices to match the desired radius
	for i := range vertices {
		vertices[i] = vertices[i].ToLen(radius)
	}

	// Add the triangles to the shape
	for _, tri := range indices {
		triangles = append(triangles, tri)

		// Add edges of the triangle
		edges = append(edges, [2]int{tri[0], tri[1]})
		edges = append(edges, [2]int{tri[1], tri[2]})
		edges = append(edges, [2]int{tri[2], tri[0]})
	}

	return Shape{
		Vertices:  vertices,
		Edges:     edges,
		Triangles: triangles,
	}
}
