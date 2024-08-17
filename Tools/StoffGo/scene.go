package main

import (
	"fmt"
	"image"
	"math"
	"sort"

	"github.com/fogleman/gg"
)

type Scene struct {
	camera *Camera
	points *[]Vec
	lines  *[][2]Vec
}

func (s *Scene) Point(p Vec) {
	// Append the new point to the slice via the pointer
	*s.points = append(*s.points, p)
}

func (s *Scene) Line(p1, p2 Vec) {
	*s.lines = append(*s.lines, [2]Vec{p1, p2})
}

func (s *Scene) Camera(cam *Camera) *Scene {
	s.camera = cam
	return s
}

func DefaultScene() *Scene {
	// Initialize the points slice and lines slice
	points := make([]Vec, 0)
	lines := make([][2]Vec, 0)
	return &Scene{
		camera: nil,
		points: &points,
		lines:  &lines,
	}
}

func (s *Scene) Render(img *image.RGBA, w, h int) {
	dc := gg.NewContextForRGBA(img)

	dc.SetRGB(0, 0, 0)
	dc.Clear()

	normalize := NormalizeVec(s.camera.screen)
	normCamera := s.camera.Normalize()

	// First, render lines
	for _, line := range *s.lines {
		projectedPt1, projectionPos1 := normCamera.Project(normalize(line[0]))
		projectedPt2, projectionPos2 := normCamera.Project(normalize(line[1]))

		if projectionPos1 == InsideFront || projectionPos2 == InsideFront {
			// If either of the points is inside the front view, draw the line
			imgW1 := float64(projectedPt1[0]+1) * float64(w) / 2
			imgH1 := float64(projectedPt1[1]+1) * float64(h) / 2
			imgW2 := float64(projectedPt2[0]+1) * float64(w) / 2
			imgH2 := float64(projectedPt2[1]+1) * float64(h) / 2

			dc.SetRGB(1, 1, 1) // Set line color to white
			dc.DrawLine(imgW1, imgH1, imgW2, imgH2)
			dc.Stroke()
		}
	}

	// Then, render points
	type pointData struct {
		normalizedPoint Vec
		distance        float64
	}

	var pointsData []pointData
	for _, pt := range *s.points { // Dereference the pointer to access the points
		normalizedPt := normalize(pt)
		distance := normalizedPt.Sub(normCamera.focus).Length() - normCamera.focus.Length()

		pointsData = append(pointsData, pointData{
			normalizedPoint: normalizedPt,
			distance:        distance,
		})
	}

	sort.Slice(pointsData, func(i, j int) bool {
		return pointsData[i].distance > pointsData[j].distance
	})

	for _, pd := range pointsData {
		projectedPt, projectionPos := normCamera.Project(pd.normalizedPoint)

		if projectionPos == InsideFront {
			imgW := float64(projectedPt[0]+1) * float64(w) / 2
			imgH := float64(projectedPt[1]+1) * float64(h) / 2

			normalizedDistance := 1.0 / math.Pow((pd.distance+1.0), .3)
			red := normalizedDistance
			blue := 1.0 - normalizedDistance
			green := 0.0

			dc.SetRGB(red, green, blue)

			size := 2 + (10-2)*normalizedDistance

			dc.DrawCircle(imgW, imgH, size)
			dc.Fill()
		}
	}

	// Finally, render additional information (text overlay)
	midpoint := s.camera.screen.TL.Add(s.camera.screen.BR).Scale(0.5)
	rotationAngles := s.camera.screen.TL.Sub(s.camera.screen.TR)
	angleX := (int(math.Atan2(rotationAngles[1], rotationAngles[0])*(180/math.Pi)+360) % 360) - 180
	angleY := (int(math.Atan2(rotationAngles[2], rotationAngles[0])*(180/math.Pi)+360) % 360) - 180
	currentZoom := midpoint.Sub(s.camera.focus).Length()

	textPadding := 10.0
	textHeight := 20.0

	dc.SetRGB(1, 1, 1)
	dc.DrawStringAnchored(fmt.Sprintf("Zoom: %.2f", currentZoom), textPadding, float64(h)-textPadding-20, 0, 1)
	dc.DrawStringAnchored(fmt.Sprintf("Midpoint: %v", midpoint), textPadding, float64(h)-textPadding-textHeight-20, 0, 1)
	dc.DrawStringAnchored(fmt.Sprintf("Angle X: %d°, Angle Y: %d°", angleX, angleY), textPadding, float64(h)-textPadding-2*textHeight-20, 0, 1)

	dc.Fill()
}
