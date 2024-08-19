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
	vec     G.Vec2
	inShape bool
}

type HexGrid struct {
	lines [][]HexVertex
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
	plane.bb = computeBB(shapeFile.Verticies)
	hexGrid := hex(plane.bb, config.C.Simulation.TriangleSize)
	hexGrid.superempose(shapeFile.Verticies)
	hexGrid.insertIntoPlane(&plane)

	return &plane
}

func (h *HexGrid) insertIntoPlane(p *Plane) {
	for i := range h.lines {
		for j := range h.lines[i] {
			if h.lines[i][j].inShape {
				// Add the vertex to the Plane and store its index
				p.Verticies = append(p.Verticies, h.lines[i][j].vec)
				currentIndex := len(p.Verticies) - 1

				if j > 0 && h.lines[i][j-1].inShape {
					leftIndex := currentIndex - 1
					p.JoinFromInt(currentIndex, leftIndex)
				}

				if i%2 == 0 {
					if i > 0 && h.lines[i-1][j].inShape {
						upperLeftIndex, _ := p.findVertex(h.lines[i-1][j].vec)
						p.JoinFromInt(currentIndex, upperLeftIndex)
					}

					if i > 0 && j < len(h.lines[i-1])-1 && h.lines[i-1][j+1].inShape {
						upperRightIndex, _ := p.findVertex(h.lines[i-1][j+1].vec)
						p.JoinFromInt(currentIndex, upperRightIndex)
					}
				} else {
					if j > 0 && h.lines[i-1][j-1].inShape {
						upperLeftIndex, _ := p.findVertex(h.lines[i-1][j-1].vec)
						p.JoinFromInt(currentIndex, upperLeftIndex)
					}

					if j < len(h.lines[i-1]) && h.lines[i-1][j].inShape {
						upperRightIndex, _ := p.findVertex(h.lines[i-1][j].vec)
						p.JoinFromInt(currentIndex, upperRightIndex)
					}
				}
			}
		}
	}
}

func (p *Plane) Join(v1, v2 G.Vec2) {
	v1Index, _ := p.findVertex(v1)
	v2Index, _ := p.findVertex(v2)

	p.JoinFromInt(v1Index, v2Index)
}

func (p *Plane) JoinFromInt(v1Index, v2Index int) {
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

func (h *HexGrid) superempose(curve []G.Vec2) {
	for i := range h.lines {
		for j := range h.lines[i] {
			h.lines[i][j].inShape = isPointInPolygon(h.lines[i][j].vec, curve)
		}
	}
}

func isPointInPolygon(point G.Vec2, polygon []G.Vec2) bool {
	intersections := 0
	n := len(polygon)

	for i := 0; i < n; i++ {
		v1 := polygon[i]
		v2 := polygon[(i+1)%n]

		if isRayIntersectingEdge(point, v1, v2) {
			intersections++
		}
	}

	return intersections%2 != 0
}

func isRayIntersectingEdge(point, v1, v2 G.Vec2) bool {
	if v1[1] > v2[1] {
		v1, v2 = v2, v1
	}

	if point[1] == v1[1] || point[1] == v2[1] {
		point[1] += 1e-9
	}

	if point[1] < v1[1] || point[1] > v2[1] {
		return false
	}

	intersectionX := v1[0] + (point[1]-v1[1])*(v2[0]-v1[0])/(v2[1]-v1[1])
	return point[0] < intersectionX
}

func hex(bb [2]G.Vec2, size float64) *HexGrid {
	triangle_h := math.Sqrt(3) / 2 * size
	num_lines := int(math.Floor((bb[1][1] - bb[0][1]) / triangle_h))

	grid := &HexGrid{
		lines: make([][]HexVertex, num_lines),
	}

	for i := 0; i < num_lines; i++ {
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
				vec:     G.Vec2{x, y},
				inShape: false,
			})
		}

		grid.lines[i] = line
	}

	return grid
}
