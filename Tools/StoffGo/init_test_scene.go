package main

import (
	"math/rand/v2"
	G "stoffgo/geometry"
	R "stoffgo/render"
)

func InitThreePoints(scene *R.Scene) {
	pt1 := G.Vec{-.8, -.2, 5}
	pt2 := G.Vec{.8, -.2, 5}
	pt3 := G.Vec{0, .5, -2}

	scene.Point(pt1)
	scene.Point(pt2)
	scene.Point(pt3)

	// Add lines between the points to form a triangle
	scene.Line(pt1, pt2)
	scene.Line(pt2, pt3)
	scene.Line(pt3, pt1)
}

func InitManyPoints(scene *R.Scene, boxSize float64) {
	numPoints := 100_000
	points := make([]G.Vec, numPoints)
	for i := 0; i < numPoints; i++ {
		x := rand.Float64()*2*boxSize - boxSize
		y := rand.Float64()*2*boxSize - boxSize
		z := rand.Float64()*2*boxSize - boxSize
		points[i] = G.Vec{x, y, z}
	}

	scene.Points = &points

	for i := 0; i < 100_000; i++ {
		index1 := rand.IntN(numPoints)
		index2 := rand.IntN(numPoints)
		scene.Line(points[index1], points[index2])
	}
}
