package main

import (
	"fmt"
	"image"
	"log"
	"math/rand"
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

		aspectRatio := float64(winWidth) / float64(winHeight)
		scene := DefaultScene().Camera(DefaultCamera(aspectRatio))

		for i := 0; i < 100_000; i++ {
			x := rand.Float64()*100 - 50
			y := rand.Float64()*100 - 50
			z := rand.Float64()*100 - 50
			scene.Point(Vec{x, y, z})
		}

		var previousTime = time.Now()
		var delta float64 = 0

		for {
			startTime := time.Now()

			for {
				e := w.NextEvent()
				switch e := e.(type) {

				case key.Event:
					switch e.Direction {
					case key.DirPress:
						keyPressed[e.Code] = true
						if e.Code == key.CodeQ || e.Code == key.CodeEscape {
							return
						}
					case key.DirRelease:
						keyPressed[e.Code] = false
					}

				case lifecycle.Event:
					if e.To == lifecycle.StageDead {
						return
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

					// Update camera with new aspect ratio
					scene.camera.Update(winWidth, winHeight)

				case paint.Event:
				}

				if time.Since(startTime) > 100 {
					break
				}
			}

			scene.Update(delta, keyPressed)
			scene.Render(pixBuffer, winWidth, winHeight)

			w.Upload(image.Point{0, 0}, screenBuffer, screenBuffer.Bounds())
			w.Publish()

			currTime := time.Now()
			delta = float64(currTime.Sub(previousTime).Nanoseconds()) / 1000000000.0
			previousTime = currTime
		}
	})
}

func (s *Scene) Update(delta_time float64, keys map[key.Code]bool) {
	hasKeyPressed := false
	for _, pressed := range keys {
		if pressed {
			hasKeyPressed = true
			break
		}
	}

	if hasKeyPressed {
		s.camera = s.camera.ReactToKeypresses(keys, delta_time)
	}
}
