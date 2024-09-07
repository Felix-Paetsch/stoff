package three

import (
	G "stoffgo/geometry"
)

type Shape struct {
	Vertices  []G.Vec
	Edges     [][2]int
	Triangles [][3]int
}

// Move shape
// Rotate shape around pt
// Scale shape
// Make sure no points overlap
// Filter Edges & Triangles if they are dublicats

// Render shape
// Figure out how forces and collisions work - maybe do that first?cd
