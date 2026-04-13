package render

import (
	"fmt"
	"image"
	"log"
	"stoffgo/config"
	"time"

	"golang.org/x/exp/shiny/driver"
	"golang.org/x/exp/shiny/screen"
	"golang.org/x/mobile/event/key"
	"golang.org/x/mobile/event/lifecycle"
	"golang.org/x/mobile/event/paint"
	"golang.org/x/mobile/event/size"
)

var (
	winWidth, winHeight int
	screenBuffer        screen.Buffer
	pixBuffer           *image.RGBA
	keyPressed          = make(map[key.Code]bool)
)

func RenderLoop(scene *Scene) {
	winWidth = config.C.WinSize[0]
	winHeight = config.C.WinSize[1]

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

		if scene.Camera == nil {
			aspectRatio := float64(winWidth) / float64(winHeight)
			scene.SetCamera(DefaultCamera(aspectRatio))
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

					scene.Camera.Update(winWidth, winHeight)

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
