package main

import (
	"encoding/json"
	"log"
	"math"
	"os"
	"stoffgo/config"
	G "stoffgo/geometry"
)

type Vertex struct {
	pos G.Vec
	vel G.Vec
	acc G.Vec
}

type Join struct {
	v   [2]int
	len float64
}

type Glue struct {
	v [2]int
}

type Universe struct {
	verticies []Vertex
	joints    []Join
	glues     []Glue
}

type ShapeFile struct {
	Verticies []G.Vec2 `json:"verticies"`
}

type Plane struct {
	Verticies []G.Vec2
	Joints    [][2]int
	bb        [2]G.Vec2
}

type HexVertex struct {
	vec          G.Vec2
	inShapeIndex int
}

type HexGrid struct {
	lines [][]HexVertex
	curve []G.Vec2
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
	data, err := os.ReadFile(file)
	if err != nil {
		log.Fatalf("Error loading shape file: %v", err)
	}

	var shapeFile ShapeFile
	err = json.Unmarshal(data, &shapeFile)
	if err != nil {
		log.Fatalf("Error loading shape file: %v", err)
	}

	var plane Plane
	shapeFile.Verticies = normalizeCurve(shapeFile.Verticies)
	plane.bb = computeBB(shapeFile.Verticies)
	hexGrid := hex(plane.bb, config.C.Simulation.TriangleSize)
	hexGrid.applyCurve(shapeFile.Verticies)
	hexGrid.insertIntoPlane(&plane)
	plane.patchBoundaryIn(shapeFile.Verticies)

	return &plane
}

func normalizeCurve(v []G.Vec2) []G.Vec2 {
	var newVertices []G.Vec2
	triangleSize := config.C.Simulation.TriangleSize

	v = append(v, v[0])
	newVertices = append(newVertices, v[0])
	n := len(v)

	currentDistance := 0.0

	for i := 0; i < n; i++ {
		nextDistance := v[(i+1)%n].Distance(v[i])
		if currentDistance+nextDistance < triangleSize {
			continue
		}

		if currentDistance > 0 {
			currentDistance = 0
			newVertices = append(newVertices, v[i])
			continue
		}

		dirVec := v[(i+1)%n].Sub(v[i])
		dir := dirVec.Normalize()
		amt := int(math.Ceil(nextDistance / triangleSize))

		partition_len := dirVec.Length() / float64(amt)

		for j := 0; j < amt; j++ {
			newPoint := v[i].Add(dir.Scale(float64(j+1) * partition_len))
			newVertices = append(newVertices, newPoint)
		}

		currentDistance = 0
	}

	return newVertices
}

func (p *Plane) patchBoundaryIn(v []G.Vec2) {
	// We assume boundary is normalized

	currentVertexCount := len(p.Verticies)
	p.Verticies = append(p.Verticies, v...)

	for i := currentVertexCount; i < len(p.Verticies)-1; i++ {
		p.JoinFromInt(i, i+1)
	}

	p.JoinFromInt(len(p.Verticies)-1, currentVertexCount)
}

func (p *Plane) Join(v1, v2 G.Vec2) {
	v1Index, _ := p.findVertex(v1)
	v2Index, _ := p.findVertex(v2)

	p.JoinFromInt(v1Index, v2Index)
}

func (p *Plane) JoinFromInt(v1Index, v2Index int) {
	// Check it doesnt exist already (?)
	p.Joints = append(p.Joints, [2]int{v1Index, v2Index})
}

func (p *Plane) findVertex(v G.Vec2) (int, bool) {
	for i, point := range p.Verticies {
		if point == v {
			return i, true
		}
	}
	return -1, false
}

func (h *HexGrid) insertIntoPlane(p *Plane) {
	hex_start_count := len(p.Verticies)
	h.insertHexIntoPlane(p)

	vertex_start_count := len(p.Verticies)
	p.Verticies = append(p.Verticies, h.curve...)

	var lastAdjacent []HexVertex

	for i := vertex_start_count; i < len(p.Verticies); i++ {
		// Join between consecutive vertices
		to := i + 1
		if i+1 == len(p.Verticies) {
			to = vertex_start_count
		}
		p.JoinFromInt(i, to)

		adjacent := h.closestVerticies(p.Verticies[i])

		for _, adj := range adjacent {
			p.JoinFromInt(i, hex_start_count+adj.inShapeIndex)
		}

		// If there's no common point between lastAdjacent and adjacent
		if i > vertex_start_count && !haveCommonVertex(lastAdjacent, adjacent) {
			// Find closest vertex in lastAdjacent to p.Verticies[i]
			closestInLastAdjacent, minDistLast := closestVertex(p.Verticies[i], lastAdjacent)

			// Find closest vertex in adjacent to p.Verticies[i-1]
			closestInAdjacent, minDistAdj := closestVertex(p.Verticies[i-1], adjacent)

			// Join the closest pair
			if minDistLast <= minDistAdj {
				p.JoinFromInt(i, hex_start_count+closestInLastAdjacent.inShapeIndex)
			} else {
				p.JoinFromInt(i-1, hex_start_count+closestInAdjacent.inShapeIndex)
			}
		}

		lastAdjacent = adjacent

	}

	// Handle the case between the last vertex and the first vertex
	firstVertex := p.Verticies[vertex_start_count]
	firstAdjacent := h.closestVerticies(firstVertex)

	if !haveCommonVertex(lastAdjacent, firstAdjacent) {
		closestInLastAdjacent, minDistLast := closestVertex(firstVertex, lastAdjacent)
		closestInFirstAdjacent, minDistFirst := closestVertex(p.Verticies[len(p.Verticies)-1], firstAdjacent)

		if minDistLast <= minDistFirst {
			p.JoinFromInt(vertex_start_count, hex_start_count+closestInLastAdjacent.inShapeIndex)
		} else {
			p.JoinFromInt(len(p.Verticies)-1, hex_start_count+closestInFirstAdjacent.inShapeIndex)
		}
	}

}

// Function to check if two slices of HexVertex have any common elements
func haveCommonVertex(a, b []HexVertex) bool {
	for _, v1 := range a {
		for _, v2 := range b {
			if v1.inShapeIndex == v2.inShapeIndex {
				return true
			}
		}
	}
	return false
}

// Function to find the closest vertex in a slice to a given point
func closestVertex(v G.Vec2, vertices []HexVertex) (HexVertex, float64) {
	closest := vertices[0]
	minDist := closest.vec.Distance(v)

	for _, vertex := range vertices[1:] {
		dist := vertex.vec.Distance(v)
		if dist < minDist {
			closest = vertex
			minDist = dist
		}
	}

	return closest, minDist
}

func (h *HexGrid) closestVerticies(v G.Vec2) []HexVertex {
	// Try Hex Cells we are contained in
	triangleSize := h.lines[0][0].vec.Distance(h.lines[0][1].vec)
	triangleHeight := math.Sqrt(3) / 2 * triangleSize
	TopLineNum := int(math.Floor((v[1] - h.lines[0][0].vec[1]) / triangleHeight))

	topJ := 0
	for i := 1; i < len(h.lines[TopLineNum]) && h.lines[TopLineNum][i].vec[1] > v[1]; i++ {
		topJ++
	}

	bottomJ := 0
	for i := 1; i < len(h.lines[TopLineNum+1]) && h.lines[TopLineNum+1][i].vec[1] > v[1]; i++ {
		bottomJ++
	}

	res := []HexVertex{}

	// If there are four vertices, remove the furthest one
	if len(res) == 4 {
		maxDistIndex := 0
		maxDist := res[0].vec.Distance(v)

		// Find the index of the furthest HexVertex
		for i := 1; i < 4; i++ {
			dist := res[i].vec.Distance(v)
			if dist > maxDist {
				maxDist = dist
				maxDistIndex = i
			}
		}

		// Remove the furthest HexVertex by slicing out the maxDistIndex
		res = append(res[:maxDistIndex], res[maxDistIndex+1:]...)
	}

	filteredRes := []HexVertex{}
	for _, hexVertex := range res {
		if hexVertex.inShapeIndex >= 0 {
			filteredRes = append(filteredRes, hexVertex)
		}
	}
	res = filteredRes

	// Return the result if any vertices were found
	if len(res) > 0 {
		return res
	}

	// Fallback: Find the closest HexVertex among all HexVertices in the grid where inShapeIndex > -1
	var closest HexVertex
	minDist := math.MaxFloat64

	for i := range h.lines {
		for j := range h.lines[i] {
			if h.lines[i][j].inShapeIndex > -1 {
				dist := h.lines[i][j].vec.Distance(v)
				if dist < minDist {
					minDist = dist
					closest = h.lines[i][j]
				}
			}
		}
	}

	return []HexVertex{closest}
}

func (h *HexGrid) insertHexIntoPlane(p *Plane) {
	for i := range h.lines {
		for j := range h.lines[i] {
			if h.lines[i][j].inShapeIndex >= 0 {
				// Add the vertex to the Plane and store its index
				p.Verticies = append(p.Verticies, h.lines[i][j].vec)
				currentIndex := len(p.Verticies) - 1

				if j > 0 && h.lines[i][j-1].inShapeIndex >= 0 {
					leftIndex := currentIndex - 1
					p.JoinFromInt(currentIndex, leftIndex)
				}

				if i%2 == 0 {
					if i > 0 && h.lines[i-1][j].inShapeIndex >= 0 {
						upperLeftIndex, _ := p.findVertex(h.lines[i-1][j].vec)
						p.JoinFromInt(currentIndex, upperLeftIndex)
					}

					if i > 0 && j < len(h.lines[i-1])-1 && h.lines[i-1][j+1].inShapeIndex >= 0 {
						upperRightIndex, _ := p.findVertex(h.lines[i-1][j+1].vec)
						p.JoinFromInt(currentIndex, upperRightIndex)
					}
				} else {
					if j > 0 && h.lines[i-1][j-1].inShapeIndex >= 0 {
						upperLeftIndex, _ := p.findVertex(h.lines[i-1][j-1].vec)
						p.JoinFromInt(currentIndex, upperLeftIndex)
					}

					if j < len(h.lines[i-1]) && h.lines[i-1][j].inShapeIndex >= 0 {
						upperRightIndex, _ := p.findVertex(h.lines[i-1][j].vec)
						p.JoinFromInt(currentIndex, upperRightIndex)
					}
				}
			}
		}
	}
}

func (h *HexGrid) applyCurve(curve []G.Vec2) {
	currentIndex := 0
	for i := range h.lines {
		for j := range h.lines[i] {
			if G.IsPointInPolygon(h.lines[i][j].vec, curve) {
				h.lines[i][j].inShapeIndex = currentIndex
				currentIndex++
			} else {
				h.lines[i][j].inShapeIndex = -1
			}
		}
	}

	h.curve = curve
}

func hex(bb [2]G.Vec2, size float64) *HexGrid {
	triangle_h := math.Sqrt(3) / 2 * size
	num_lines := int(math.Ceil((bb[1][1] - bb[0][1]) / triangle_h))

	grid := &HexGrid{
		lines: make([][]HexVertex, num_lines+1),
	}

	for i := 0; i < num_lines+1; i++ {
		y := bb[0][1] + float64(i)*triangle_h
		var startX float64
		if i%2 == 0 {
			startX = bb[0][0] + size/2
		} else {
			startX = bb[0][0]
		}

		var line []HexVertex
		for x := startX; x <= bb[1][0]; x += size {
			line = append(line, HexVertex{
				vec:          G.Vec2{x, y},
				inShapeIndex: -1,
			})
		}

		grid.lines[i] = line
	}

	return grid
}
