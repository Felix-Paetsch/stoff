package main

import (
	"encoding/json"
	"log"
	"math"
	"math/rand/v2"
	"os"
	"stoffgo/config"
	G "stoffgo/geometry"
	"stoffgo/tools"

	"github.com/fogleman/delaunay"
)

type ShapeFile struct {
	Vertices []G.Vec2 `json:"vertices"`
}

type Boundary struct {
	start       int
	end         int
	orientation bool
}

type SimulationPoint struct {
	pos   G.Vec2
	vel   G.Vec2
	acc   G.Vec2
	fixed bool
}

type PhysicsBox struct {
	Points           []SimulationPoint
	Boundaries       []Boundary
	BB               [2]G.Vec2
	targetPtDistance float64
	// Points to start end end index in points of the fixed boundaries
}

type Plane struct {
	Vertices   []G.Vec2
	Joints     [][2]int
	Boundaries []Boundary
	BB         [2]G.Vec2
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

func loadShape(file string) *Plane {
	b := loadShapeIntoBox(file)
	for i := 0; i < config.C.Simulation2D.SimulationSteps; i++ {
		b.simulationStep()
	}
	b.filterExpulsedPoints()
	p := b.toPlane()
	p.triangulate()
	return p
}

func loadShapeIntoBox(file string) *PhysicsBox {
	data, err := os.ReadFile(file)
	if err != nil {
		log.Fatalf("Error loading shape file: %v", err)
	}

	var shapeFile ShapeFile
	err = json.Unmarshal(data, &shapeFile)
	if err != nil {
		log.Fatalf("Error loading shape file: %v", err)
	}

	target_pt_distance := math.Sqrt(config.C.Simulation2D.AreaPerPoint/math.Pi) * 2
	shapeFile.Vertices = normalizeCurve(shapeFile.Vertices, target_pt_distance)

	var box PhysicsBox
	box.targetPtDistance = target_pt_distance
	box.boundary(shapeFile.Vertices)
	box.hex()

	return &box
}

func (b *PhysicsBox) simulationStep() {
	EPS := 1e-10
	exp := config.C.Simulation2D.GravityExp
	R := math.Pow(b.targetPtDistance, exp) // reference distance

	BoundaryPoints := b.Points[b.Boundaries[0].start:b.Boundaries[0].end]

	for i := range b.Points {
		// Force between points
		for j := i; j < len(b.Points); j++ {
			vec := b.Points[j].pos.Sub(b.Points[i].pos)
			d := vec.Length()

			if d > config.C.Simulation2D.PointForceInfluenceRadius*b.targetPtDistance {
				continue
			}

			accAmt := R * config.C.Simulation2D.PointForceMult / math.Pow(d+EPS, exp)
			acc := vec.ToLen(accAmt)

			if math.IsNaN(acc[0]) {
				acc = G.Vec2{R * rand.Float64(), R * rand.Float64()}
			}

			b.Points[i].acc = b.Points[i].acc.Sub(acc)
			b.Points[j].acc = b.Points[j].acc.Add(acc)
		}

		tools.Assert(!math.IsNaN(b.Points[i].acc[0]), "IsNaN")

		// Force from boundary (only apply if close enough)
		if b.Points[i].fixed {
			continue
		}
		for j := 0; j < len(BoundaryPoints); j++ {
			e0 := BoundaryPoints[j].pos
			e1 := BoundaryPoints[(j+1)%len(BoundaryPoints)].pos

			c := G.ClosestVecOnLineSegment([2]G.Vec2{e0, e1}, b.Points[i].pos)
			d := b.Points[i].pos.Distance(c)
			if d > b.targetPtDistance*config.C.Simulation2D.BoundaryForceInfluenceDistance {
				continue
			}

			accAmt := R * config.C.Simulation2D.BoundaryForceMult / math.Pow(d, exp)
			if math.IsNaN(accAmt) || math.IsInf(accAmt, 1) {
				accAmt = R * 1000
			}

			dir := e1.Sub(e0).GetOrthonormal()
			if !b.Boundaries[0].orientation {
				dir = dir.Scale(-1)
			}

			acc := dir.Scale(accAmt + EPS)

			b.Points[i].acc = b.Points[i].acc.Add(acc)
		}

		tools.Assert(!math.IsNaN(b.Points[i].acc[0]), "hwa")
	}

	for i := range b.Points {
		if !b.Points[i].fixed {
			b.Points[i].vel = b.Points[i].vel.Scale(config.C.Simulation2D.VelocityStepScale)
			b.Points[i].vel = b.Points[i].vel.Add(b.Points[i].acc)

			if b.Points[i].vel.Length() > b.targetPtDistance*config.C.Simulation2D.VelocityMax {
				b.Points[i].vel.ToLen(b.targetPtDistance * config.C.Simulation2D.VelocityMax)
			}

			b.Points[i].pos = b.Points[i].pos.Add(b.Points[i].vel)
			b.Points[i].acc = G.Vec2{0, 0}
		}
	}
}

func (b *PhysicsBox) filterExpulsedPoints() {
	var filteredPoints []SimulationPoint
	var newBoundaries []Boundary

	currentlyInBoundary := false
	boundaryStart := 0
	currentIndex := 0
	boundaryCount := 0
	for _, pt := range b.Points {
		if currentlyInBoundary && !pt.fixed {
			currentlyInBoundary = false
			newBoundaries = append(newBoundaries, Boundary{boundaryStart, currentIndex, b.Boundaries[boundaryCount].orientation})
			boundaryCount++
		} else if !currentlyInBoundary && pt.fixed {
			currentlyInBoundary = true
			boundaryStart = currentIndex
		}

		if pt.fixed || b.pointInBoundary(pt.pos) {
			filteredPoints = append(filteredPoints, pt)
			currentIndex++
		}
	}

	b.Points = filteredPoints
	b.Boundaries = newBoundaries
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

func (b *PhysicsBox) boundary(vb []G.Vec2) *PhysicsBox {
	// The first boundary is assumed to be the outer boundary, the rest in the inside
	if len(b.Boundaries) > 0 {
		tools.Assert(
			b.pointInBoundary(vb[0]),
			"Expected new bounday to be contained in first one")
	} else {
		b.BB = computeBB(vb)
	}

	old_len := len(b.Points)
	for i := 0; i < len(vb); i++ {
		b.Points = append(b.Points, SimulationPoint{
			pos:   vb[i],
			vel:   G.Vec2{0, 0},
			acc:   G.Vec2{0, 0},
			fixed: true,
		})
	}

	firstVec := vb[1].Sub(vb[0])
	orth := firstVec.GetOrthogonal().ToLen(0.00001)
	test_pt := vb[0].Add(firstVec.Scale(0.5)).Add(orth)

	b.Boundaries = append(b.Boundaries, Boundary{
		start:       old_len,
		end:         len(b.Points),
		orientation: G.IsPointInPolygon(test_pt, vb),
	})
	return b
}

func (b *PhysicsBox) hex() *PhysicsBox {
	tools.Assert(len(b.Boundaries) > 0, "We need a boundary before calling Hex")

	triangle_h := math.Sqrt(3) / 2 * b.targetPtDistance
	num_lines := int(math.Ceil((b.BB[1][1] - b.BB[0][1]) / triangle_h))

	for i := 0; i < num_lines+1; i++ {
		y := b.BB[0][1] + float64(i)*triangle_h
		var startX float64
		if i%2 == 0 {
			startX = b.BB[0][0] + b.targetPtDistance/2
		} else {
			startX = b.BB[0][0]
		}

		for x := startX; x <= b.BB[1][0]; x += b.targetPtDistance {
			if (b.pointInBoundary(G.Vec2{x, y})) {
				b.Points = append(b.Points, SimulationPoint{
					pos:   G.Vec2{x, y},
					vel:   G.Vec2{0, 0},
					acc:   G.Vec2{0, 0},
					fixed: false,
				})
			}
		}
	}

	return b
}

func (b *PhysicsBox) toPlane() *Plane {
	var p Plane
	p.BB = b.BB
	p.Vertices = make([]G.Vec2, len(b.Points))

	for i, point := range b.Points {
		p.Vertices[i] = point.pos
	}

	p.Boundaries = b.Boundaries
	return &p
}

func (p *Plane) triangulate() {
	// Convert Plane vertices to delaunay.Points
	points := make([]delaunay.Point, len(p.Vertices))
	for i, vertex := range p.Vertices {
		points[i] = delaunay.Point{X: vertex[0], Y: vertex[1]}
	}

	triangulation, err := delaunay.Triangulate(points)
	tools.Assert(err == nil, "isNil")

	ts := triangulation.Triangles
	_ = ts
	hs := triangulation.Halfedges
	for i, h := range hs {
		if i > h {
			p1_i := ts[i]
			p2_i := ts[nextHalfEdge(i)]
			center := p.Vertices[p1_i].Add(p.Vertices[p2_i]).Scale(0.5)
			if p.pointInBoundary(center) {
				p.Joints = append(p.Joints, [2]int{p1_i, p2_i})
			}
		}
	}
}

func nextHalfEdge(e int) int {
	if e%3 == 2 {
		return e - 2
	}
	return e + 1
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