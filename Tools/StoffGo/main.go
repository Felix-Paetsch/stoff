package main

import (
	"stoffgo/config"
	G "stoffgo/geometry"
	R "stoffgo/render"
	"stoffgo/three"
)

func AddToScene(scene *R.Scene, s three.Shape) {
	// Add vertices to the scene
	for _, vertex := range s.Vertices {
		scene.Point(vertex)
	}

	// Add edges to the scene
	for _, edge := range s.Edges {
		scene.LineFromInt(edge[0], edge[1])
	}
}

func main() {
	config.LoadConfig("config.json")
	scene := R.DefaultScene()

	// Define a cube shape
	cube := three.Shape{
		Vertices: []G.Vec{
			{-1, -1, -1}, {1, -1, -1}, {1, 1, -1}, {-1, 1, -1}, // Bottom face
			{-1, -1, 1}, {1, -1, 1}, {1, 1, 1}, {-1, 1, 1}, // Top face
		},
		Edges: [][2]int{
			{0, 1}, {1, 2}, {2, 3}, {3, 0}, // Bottom face edges
			{4, 5}, {5, 6}, {6, 7}, {7, 4}, // Top face edges
			{0, 4}, {1, 5}, {2, 6}, {3, 7}, // Side edges
		},
	}

	// Add the cube shape to the scene
	AddToScene(scene, cube)

	scene.SetCamera(R.DefaultCamera(1))
	R.RenderLoop(scene)
}
