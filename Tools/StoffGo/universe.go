package main

import (
	"math"
	G "stoffgo/geometry"
)

type Vertex struct {
	pos G.Vec
	vel G.Vec
	acc G.Vec
}

type Join struct {
	v   [2]*Vertex
	len float64
}

type Glue struct {
	v [2]*Vertex
}

type Universe struct {
	verticies []Vertex
	joints    []Join
	glues     []Glue
}

type Plain struct {
	verticies []G.Vec2
	bb        [2]G.Vec2
}

func computeBB(vertices []G.Vec2) [2]G.Vec2 {
	// Initialize min and max with Infinity and -Infinity respectively
	min := G.Vec2{math.Inf(1), math.Inf(1)}
	max := G.Vec2{math.Inf(-1), math.Inf(-1)}

	// Iterate over each vertex to find the min and max corners
	for _, v := range vertices {
		if v[0] < min[0] {
			min[0] = v[0] // Update min X
		}
		if v[1] < min[1] {
			min[1] = v[1] // Update min Y
		}
		if v[0] > max[0] {
			max[0] = v[0] // Update max X
		}
		if v[1] > max[1] {
			max[1] = v[1] // Update max Y
		}
	}

	return [2]G.Vec2{min, max}
}
