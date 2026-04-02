package shapes2d

import (
	"encoding/json"
	"log"
	"math"
	"math/rand/v2"
	"os"
	"stoffgo/config"
	G "stoffgo/geometry"
	"stoffgo/tools"
)

type ShapeFile struct {
	Vertices []G.Vec2 `json:"vertices"`
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

func (p SimulationPoint) Pos() G.Vec2 { return p.pos }
func LoadShapeIntoBox(file string) *PhysicsBox {
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

func (b *PhysicsBox) FilterExpulsedPoints() *PhysicsBox {
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

	return b
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

func (b *PhysicsBox) SimulationStep() *PhysicsBox {
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

	return b
}

func (b *PhysicsBox) ToPlane() *Plane {
	var p Plane
	p.BB = b.BB
	p.Vertices = make([]G.Vec2, len(b.Points))

	for i, point := range b.Points {
		p.Vertices[i] = point.pos
	}

	p.Boundaries = b.Boundaries
	return &p
}
