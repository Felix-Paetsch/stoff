package main

import (
	"stoffgo/config"
	R "stoffgo/render"
)

func main() {
	config.LoadConfig("config.json")

	scene := R.DefaultScene()
	InitManyPoints(scene, 100)
	R.RenderLoop(scene)
}
