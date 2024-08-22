package _testing

import (
	G "stoffgo/geometry"
	R "stoffgo/render"
	shapes2d "stoffgo/shapes2D"
	"time"
)

func TestShapeLoading(file string) {
	scene := R.DefaultScene()
	scene.SetCamera(R.DefaultCamera(1))
	go R.RenderLoop(scene)

	b := shapes2d.LoadShapeIntoBox(file)
	for {
		b.SimulationStep()
		UpdateScene(scene, b)
		time.Sleep(10 * time.Millisecond)
	}
}

func UpdateScene(scene *R.Scene, b *shapes2d.PhysicsBox) {
	var newPoints []G.Vec

	b.FilterExpulsedPoints()
	plane := b.ToPlane()
	plane.Triangulate()
	for _, vertex := range plane.Vertices {
		vec3D := G.Vec{vertex[0], -vertex[1], 0}
		newPoints = append(newPoints, vec3D)
	}

	scene.Lines = nil
	scene.Points = &newPoints
	scene.Lines = &plane.Joints
}
