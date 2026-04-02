package main

import (
	"stoffgo/config"
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

	// Create a sphere shape
	sphere := three.IcoSphere(1.0, 5)

	// Add the sphere shape to the scene
	AddToScene(scene, sphere)

	scene.SetCamera(R.DefaultCamera(1))
	R.RenderLoop(scene)
}
