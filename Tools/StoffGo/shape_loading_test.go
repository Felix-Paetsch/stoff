package main

import (
	G "stoffgo/geometry"
	R "stoffgo/render"
	"time"
)

func test() {
	scene := R.DefaultScene()
	// InitManyPoints(scene, 100)

	scene.SetCamera(R.DefaultCamera(1))
	go R.RenderLoop(scene)

	b := loadShapeIntoBox("test.json")
	for {
		UpdateScene(scene, b)
		b.simulationStep()
		time.Sleep(10 * time.Millisecond)
	}
}

func UpdateScene(scene *R.Scene, b *PhysicsBox) {
	var newPoints []G.Vec

	plane := b.toPlane()
	for _, vertex := range plane.Vertices {
		vec3D := G.Vec{vertex[0], -vertex[1], 0}
		newPoints = append(newPoints, vec3D)
	}

	scene.Lines = nil
	scene.Points = &newPoints
	scene.Lines = &plane.Joints
}
