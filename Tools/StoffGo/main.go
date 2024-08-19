package main

import (
	"stoffgo/config"
	G "stoffgo/geometry"
	R "stoffgo/render"
)

func main() {
	config.LoadConfig("config.json")

	scene := R.DefaultScene()
	// InitManyPoints(scene, 100)

	p := loadShape("test.json")
	AddShapeToScene(scene, p)
	scene.Point(G.Vec{1, 0, -5})
	scene.Point(G.Vec{-1, 0, -5})
	scene.Point(G.Vec{0, -1, -5})

	scene.SetCamera(R.DefaultCamera(1))

	// _ = scene
	R.RenderLoop(scene)
}

func AddShapeToScene(scene *R.Scene, plane *Plane) {
	// Remember the number of points before adding new ones
	initialPointCount := len(*scene.Points)

	// Convert each 2D vertex in the plane to 3D and add it to the scene
	for _, vertex := range plane.Verticies {
		vec3D := G.Vec{vertex[0], -vertex[1], 0} // Convert to 3D with Z=0
		scene.Point(vec3D)
	}

	// Add edges (lines) to the scene using the indices of the added vertices
	for _, edge := range plane.Joints {
		index1 := initialPointCount + edge[0]
		index2 := initialPointCount + edge[1]
		scene.Line((*scene.Points)[index1], (*scene.Points)[index2])
	}
}
