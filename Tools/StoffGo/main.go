package main

import (
	"fmt"
	"image"
	"log"
	"time"

	"golang.org/x/exp/shiny/driver"
	"golang.org/x/exp/shiny/screen"
	"golang.org/x/mobile/event/key"
	"golang.org/x/mobile/event/lifecycle"
	"golang.org/x/mobile/event/paint"
	"golang.org/x/mobile/event/size"
)

var (
	winWidth, winHeight = 800, 600
	screenBuffer        screen.Buffer
	pixBuffer           *image.RGBA
	keyPressed          = make(map[key.Code]bool)
)

func main() {
	driver.Main(func(s screen.Screen) {
		w, err := s.NewWindow(&screen.NewWindowOptions{
			Title:  "3D Scene Renderer",
			Width:  winWidth,
			Height: winHeight,
		})
		if err != nil {
			fmt.Printf("Failed to create Window - %v", err)
			return
		}
		defer w.Release()

		screenBuffer, err = s.NewBuffer(image.Point{winWidth, winHeight})
		if err != nil {
			log.Fatalf("%v - failed to create screen buffer", err)
		}
		defer screenBuffer.Release()
		pixBuffer = screenBuffer.RGBA()

		// Create a scene with the default camera
		scene := Scene{
			camera: DefaultCamera(),
			points: []Vec{},
		}

		scene.Point(Vec{0, 0, .1})

		var previousTime = time.Now()
		var delta float64 = 0

		for {
			startTime := time.Now()

			// Handle window events:
			for {
				e := w.NextEvent()
				switch e := e.(type) {

				case key.Event:
					switch e.Direction {
					case key.DirPress:
						keyPressed[e.Code] = true
						if e.Code == key.CodeQ || e.Code == key.CodeEscape {
							return // quit app when "q" or "Escape" is pressed
						}
					case key.DirRelease:
						keyPressed[e.Code] = false
					}

				case lifecycle.Event:
					if e.To == lifecycle.StageDead {
						return // quit the application when the window is closed.
					}

				case size.Event:
					winWidth = e.WidthPx
					winHeight = e.HeightPx
					screenBuffer, err = s.NewBuffer(image.Point{winWidth, winHeight})
					if err != nil {
						log.Fatalf("%v - failed to create screen buffer", err)
					}
					defer screenBuffer.Release()
					pixBuffer = screenBuffer.RGBA()

				case paint.Event:
					// Handle paint events
				}

				// Stop processing events after each iteration of main loop
				if time.Since(startTime) > 100 {
					break
				}
			}

			// Update the scene with delta_time and key states
			scene.Update(delta, keyPressed)

			// Render the scene to the buffer with updated window dimensions
			scene.Render(pixBuffer, winWidth, winHeight)

			w.Upload(image.Point{0, 0}, screenBuffer, screenBuffer.Bounds())
			w.Publish()

			currTime := time.Now()
			delta = float64(currTime.Sub(previousTime).Nanoseconds()) / 1000000000.0
			previousTime = currTime
		}
	})
}

// Update function for Scene with delta_time and key state parameters
func (s *Scene) Update(delta_time float64, keys map[key.Code]bool) {
	// Check if any keys are pressed
	hasKeyPressed := false
	for _, pressed := range keys {
		if pressed {
			hasKeyPressed = true
			break
		}
	}

	// Only call ReactToKeypresses if there are keys being pressed
	if hasKeyPressed {
		s.camera = s.camera.ReactToKeypresses(keys, delta_time)
	}
}
