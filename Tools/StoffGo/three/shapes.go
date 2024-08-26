package three

import (
	G "stoffgo/geometry"
)

type Shape struct {
	Vertices  []G.Vec
	Edges     [][2]int
	Triangles [][3]int
}

func Sphere(center G.Vec, r float64, n int) Shape {
	shape := Shape{}
	vertexMap := make(map[G.Vec]int) // Map to ensure unique vertices

	// Define cube vertices
	cubeVertices := []G.Vec{
		{-1, -1, -1}, {1, -1, -1}, {1, 1, -1}, {-1, 1, -1}, // Bottom face
		{-1, -1, 1}, {1, -1, 1}, {1, 1, 1}, {-1, 1, 1}, // Top face
	}

	// Define cube faces (in terms of vertex indices)
	cubeFaces := [][4]int{
		{0, 1, 2, 3}, // Bottom
		{4, 5, 6, 7}, // Top
		{0, 1, 5, 4}, // Front
		{2, 3, 7, 6}, // Back
		{0, 3, 7, 4}, // Left
		{1, 2, 6, 5}, // Right
	}

	// Subdivide each face into triangles
	for _, face := range cubeFaces {
		SubdivideFace(center, r, n, face, cubeVertices, &shape, vertexMap)
	}

	return shape
}

func SubdivideFace(center G.Vec, r float64, n int, face [4]int, cubeVertices []G.Vec, shape *Shape, vertexMap map[G.Vec]int) {
	// Linear interpolation between face vertices
	for i := 0; i <= n; i++ {
		for j := 0; j <= n-i; j++ {
			v1 := G.Interpolate(cubeVertices[face[0]], cubeVertices[face[1]], float64(i)/float64(n))
			v2 := G.Interpolate(cubeVertices[face[3]], cubeVertices[face[2]], float64(j)/float64(n))

			v := G.Interpolate(v1, v2, float64(j)/float64(n-i))

			// Normalize to sphere
			v = v.Sub(center).Normalize().Scale(r).Add(center)

			vertexIndex := addVertex(v, shape, vertexMap)

			if i > 0 && j > 0 {
				a := vertexIndex
				b := addVertex(G.Interpolate(v1, v2, float64(j-1)/float64(n-i)), shape, vertexMap)
				c := addVertex(G.Interpolate(G.Interpolate(cubeVertices[face[0]], cubeVertices[face[1]], float64(i-1)/float64(n)),
					G.Interpolate(cubeVertices[face[3]], cubeVertices[face[2]], float64(j)/float64(n)),
					float64(j)/float64(n-(i-1))), shape, vertexMap)

				shape.Triangles = append(shape.Triangles, [3]int{a, b, c})

				// Add edges
				addEdge(a, b, shape)
				addEdge(b, c, shape)
				addEdge(c, a, shape)
			}
		}
	}
}

// addVertex adds a vertex if it's not already in the map, and returns its index
func addVertex(v G.Vec, shape *Shape, vertexMap map[G.Vec]int) int {
	if idx, exists := vertexMap[v]; exists {
		return idx
	}
	shape.Vertices = append(shape.Vertices, v)
	idx := len(shape.Vertices) - 1
	vertexMap[v] = idx
	return idx
}

// addEdge adds an edge if it doesn't already exist in the shape
func addEdge(v1, v2 int, shape *Shape) {
	edge := [2]int{v1, v2}
	// Ensure the edge is always stored in a consistent order (smallest index first)
	if v1 > v2 {
		edge = [2]int{v2, v1}
	}
	// Check if the edge already exists to avoid duplicates
	for _, e := range shape.Edges {
		if e == edge {
			return
		}
	}
	shape.Edges = append(shape.Edges, edge)
}
