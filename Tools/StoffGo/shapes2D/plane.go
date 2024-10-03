package shapes2d

import (
	G "stoffgo/geometry"

	"github.com/ByteArena/poly2tri-go"
)

type Plane struct {
	Vertices   []G.Vec2
	Joints     [][2]int
	Boundaries []Boundary
	BB         [2]G.Vec2
}

func (p *Plane) Triangulate() {
	// Step 1: Initialize the contour with the first boundary
	contour := make([]*poly2tri.Point, p.Boundaries[0].end-p.Boundaries[0].start)
	pointToIndexMap := make(map[*poly2tri.Point]int)

	for i := p.Boundaries[0].start; i < p.Boundaries[0].end; i++ {
		pt := poly2tri.NewPoint(p.Vertices[i][0], p.Vertices[i][1])
		contour[i-p.Boundaries[0].start] = pt
		pointToIndexMap[pt] = i
	}

	// Step 2: Initialize the SweepContext with the outer contour
	swctx := poly2tri.NewSweepContext(contour, false)

	// Add points that are not part of the outer boundary
	for i := 0; i < len(p.Vertices); i++ {
		if i < p.Boundaries[0].start || p.Boundaries[0].end <= i {
			pt := poly2tri.NewPoint(p.Vertices[i][0], p.Vertices[i][1])
			swctx.AddPoint(pt)
			pointToIndexMap[pt] = i
		}
	}

	// Perform the triangulation
	swctx.Triangulate()

	// Retrieve the resulting triangles
	triangles := swctx.GetTriangles()

	// Step 3: Loop over all triangles and edges, avoiding duplicates
	edgeSet := make(map[[2]int]bool)

	for _, t := range triangles {
		for i := 0; i < 3; i++ {
			p1 := t.Points[i]
			p2 := t.Points[(i+1)%3]

			// Get the indices of these points in the Plane.Vertices array
			p1_i := pointToIndexMap[p1]
			p2_i := pointToIndexMap[p2]

			// Normalize the edge as (minIndex, maxIndex) to avoid duplicates
			edge := [2]int{p1_i, p2_i}
			if p1_i > p2_i {
				edge = [2]int{p2_i, p1_i}
			}

			// Check if the edge has already been added
			if _, exists := edgeSet[edge]; !exists {
				edgeSet[edge] = true
				// Add to p.Joints or other processing
				center := p.Vertices[p1_i].Add(p.Vertices[p2_i]).Scale(0.5)
				if p.pointInBoundary(center) {
					p.Joints = append(p.Joints, [2]int{p1_i, p2_i})
				}
			}
		}
	}
}
