package main

import (
	"stoffgo/config"
	G "stoffgo/geometry"
	R "stoffgo/render"
)

func main() {
	config.LoadConfig("config.json")
	scene := R.DefaultScene()
	cubeVertices := []G.Vec{
		{-1, -1, -1}, {1, -1, -1}, {1, 1, -1}, {-1, 1, -1}, // Bottom face
		{-1, -1, 1}, {1, -1, 1}, {1, 1, 1}, {-1, 1, 1}, // Top face
	}

	// Add vertices to the scene
	for i := 0; i < len(cubeVertices); i++ {
		scene.Point(cubeVertices[i])
	}

	// Add lines for the bottom face
	scene.LineFromInt(0, 1) // Bottom face edge 1
	scene.LineFromInt(1, 2) // Bottom face edge 2
	scene.LineFromInt(2, 3) // Bottom face edge 3
	scene.LineFromInt(3, 0) // Bottom face edge 4

	// Add lines for the top face
	scene.LineFromInt(4, 5) // Top face edge 1
	scene.LineFromInt(5, 6) // Top face edge 2
	scene.LineFromInt(6, 7) // Top face edge 3
	scene.LineFromInt(7, 4) // Top face edge 4

	// Add lines connecting the top and bottom faces
	scene.LineFromInt(0, 4) // Side edge 1
	scene.LineFromInt(1, 5) // Side edge 2
	scene.LineFromInt(2, 6) // Side edge 3
	scene.LineFromInt(3, 7) // Side edge 4

	scene.SetCamera(R.DefaultCamera(1))
	R.RenderLoop(scene)
}
