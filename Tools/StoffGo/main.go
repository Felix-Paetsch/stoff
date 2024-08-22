package main

import (
	"stoffgo/config"
	G "stoffgo/geometry"
	R "stoffgo/render"
	shapes2d "stoffgo/shapes2D"
)

func main() {
	config.LoadConfig("config.json")
	scene := R.DefaultScene()

	p := shapes2d.LoadShape("test.json")
	for _, vertex := range p.Vertices {
		vec3D := G.Vec{vertex[0], -vertex[1], 0}
		*scene.Points = append(*scene.Points, vec3D)
	}

	scene.Lines = &p.Joints

	scene.SetCamera(R.DefaultCamera(1))
	R.RenderLoop(scene)
}
