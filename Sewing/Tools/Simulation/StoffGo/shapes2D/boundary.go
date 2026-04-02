package shapes2d

import (
	"math"
	G "stoffgo/geometry"
	"stoffgo/tools"
)

type Boundary struct {
	start       int
	end         int
	orientation bool
}

func (b *PhysicsBox) pointInBoundary(pt G.Vec2) bool {
	tools.Assert(len(b.Boundaries) > 0, "We need a boundary before calling Hex")
	BoundarySimPoints := b.Points[b.Boundaries[0].start:b.Boundaries[0].end]
	Boundary := make([]G.Vec2, len(BoundarySimPoints))
	for i, v := range BoundarySimPoints {
		Boundary[i] = v.pos
	}

	return G.IsPointInPolygon(pt, Boundary)
}

func (p *Plane) pointInBoundary(pt G.Vec2) bool {
	tools.Assert(len(p.Boundaries) > 0, "We need a boundary before calling Hex")
	return G.IsPointInPolygon(pt, p.Vertices[p.Boundaries[0].start:p.Boundaries[0].end]) ||
		G.IsPointOnPolygon(pt, p.Vertices[p.Boundaries[0].start:p.Boundaries[0].end], 0.0000000001)
}

func normalizeCurve(v []G.Vec2, target_pt_distance float64) []G.Vec2 {
	var newVertices []G.Vec2

	v = append(v, v[0])
	newVertices = append(newVertices, v[0])
	n := len(v)

	currentDistance := 0.0

	for i := 0; i < n; i++ {
		nextDistance := v[(i+1)%n].Distance(v[i])
		if currentDistance+nextDistance < target_pt_distance {
			continue
		}

		if currentDistance > 0 {
			currentDistance = 0
			newVertices = append(newVertices, v[i])
			continue
		}

		dirVec := v[(i+1)%n].Sub(v[i])
		dir := dirVec.Normalize()
		amt := int(math.Ceil(nextDistance / target_pt_distance))

		partition_len := dirVec.Length() / float64(amt)

		for j := 0; j < amt; j++ {
			newPoint := v[i].Add(dir.Scale(float64(j+1) * partition_len))
			newVertices = append(newVertices, newPoint)
		}

		currentDistance = 0
	}

	// Implementing the final if block
	first := newVertices[0]
	last := newVertices[len(newVertices)-1]
	secondLast := newVertices[len(newVertices)-2]

	if last.Distance(first) < 5 {
		if secondLast.Distance(first) < 10 {
			// Remove the last point
			newVertices = newVertices[:len(newVertices)-1]
		} else {
			// Move the last point to halfway between the first and second last point
			newVertices[len(newVertices)-1] = secondLast.Add(first).Scale(0.5)
		}
	}

	return newVertices
}

func computeBB(vertices []G.Vec2) [2]G.Vec2 {
	min := G.Vec2{math.Inf(1), math.Inf(1)}
	max := G.Vec2{math.Inf(-1), math.Inf(-1)}

	for _, v := range vertices {
		if v[0] < min[0] {
			min[0] = v[0]
		}
		if v[1] < min[1] {
			min[1] = v[1]
		}
		if v[0] > max[0] {
			max[0] = v[0]
		}
		if v[1] > max[1] {
			max[1] = v[1]
		}
	}

	return [2]G.Vec2{min, max}
}
