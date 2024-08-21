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
	for _, vertex := range p.Vertices {
		vec3D := G.Vec{vertex[0], -vertex[1], 0}
		*scene.Points = append(*scene.Points, vec3D)
	}

	scene.Lines = &p.Joints

	scene.SetCamera(R.DefaultCamera(1))
	R.RenderLoop(scene)
}
