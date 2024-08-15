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
	sizeEvent           size.Event
	screenBuffer        screen.Buffer
	pixBuffer           *image.RGBA
	// Key state tracking
	keyPressed = make(map[key.Code]bool)
)

const (
	targetFPS  = 120
	frameDelay = time.Second / targetFPS // 1/60th of a second per frame (~16.67ms)
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
		//scene.Point(Vec{-.5, -.5, .1})
		//scene.Point(Vec{0, .5, .1})

		var previousTime = time.Now()
		var delta float64 = 0

		for {
			startTime := time.Now()

			// Handle window events:
			switch e := w.NextEvent().(type) {

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

			case paint.Event:
				// Ignore paint events; we're managing rendering in the loop
			}

			// Update the scene with delta_time and key states
			scene.Update(delta, keyPressed)

			// Render the scene to the buffer
			scene.Render(pixBuffer, winWidth, winHeight)

			w.Upload(image.Point{0, 0}, screenBuffer, screenBuffer.Bounds())
			w.Publish()

			currTime := time.Now()
			delta = float64(currTime.Sub(previousTime).Nanoseconds()) / 1000000000.0
			previousTime = currTime

			// Calculate how long the frame took to render
			elapsed := time.Since(startTime)

			// If the frame took less time than the target, sleep for the remaining time
			if elapsed < frameDelay {
				time.Sleep(frameDelay - elapsed)
			}

			// fmt.Printf("\rRendering at %.5f ms/frame", delta*1000)
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

		normalize := NormalizeVec(s.camera.screen)
		fmt.Println("TL:", normalize(s.camera.screen.TL))
		fmt.Println("BL:", normalize(s.camera.screen.BL))
		fmt.Println("TR:", normalize(s.camera.screen.TR))
		fmt.Println("BR:", normalize(s.camera.screen.BR))
		fmt.Println("F:", normalize(s.camera.focus))

	}
}
