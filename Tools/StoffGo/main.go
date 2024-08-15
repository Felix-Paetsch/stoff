package main

func main() {
	// Create a scene with the default camera
	scene := Scene{
		camera: DefaultCamera(),
		points: []Vec{},
	}

	scene.Point(Vec{0, 0, .1})
	scene.Point(Vec{0, -.5, .1})
	scene.Point(Vec{0, .5, .1})

	// Render the scene to "out.png"
	scene.Render("out.png", 800, 600)
}
