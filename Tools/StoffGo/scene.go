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

	// Array to store indicator points where lines intersect the screen
	var lineThroughScreenIndicators []Vec

	// First, render lines
	for _, line := range *s.lines {
		norm0 := normalize(line[0])
		norm1 := normalize(line[1])
		projectedPt1, projectionPos1 := normCamera.Project(norm0)
		projectedPt2, projectionPos2 := normCamera.Project(norm1)

		if projectionPos1 != InsideFront && projectionPos2 != InsideFront {
			continue
		}

		if projectionPos2 == InsideFront && projectionPos1 != InsideFront {
			t := projectedPt1
			projectedPt1 = projectedPt2
			projectedPt2 = t

			projectionPos2 = projectionPos1
		}

		// First point is inside front
		if projectionPos2 == OutsideBehind || projectionPos2 == InsideBehind {
			// Find intersection with screen plane and set projectionPos2 to be that value
			intersection, _ := LinePlaneIntersection(norm0, norm1, normCamera.screen.BL, normCamera.screen.TL, normCamera.screen.BR)
			projectedPt2 = intersection

			// Add the intersection point to the array of indicators
			lineThroughScreenIndicators = append(lineThroughScreenIndicators, intersection)
		}

		// Draw the line
		imgW1 := float64(projectedPt1[0]+1) * float64(w) / 2
		imgH1 := (projectedPt1[1] + float64(w)/float64(h)) * float64(h) / 2
		imgW2 := float64(projectedPt2[0]+1) * float64(w) / 2
		imgH2 := (projectedPt2[1] + float64(w)/float64(h)) * float64(h) / 2

		dc.SetRGB(1, 1, 1) // Set line color to white
		dc.DrawLine(imgW1, imgH1, imgW2, imgH2)
		dc.Stroke()
	}

	// Then, render points
	type pointData struct {
		normalizedPoint Vec
		distance        float64
	}

	var pointsData []pointData
	for _, pt := range *s.points {
		normalizedPt := normalize(pt)

		var distance float64
		if s.camera.orth {
			distance = normalizedPt.Sub(normCamera.focus).Length() - normCamera.focus.Length()
		} else {
			distance = math.Abs(normalizedPt[2])
		}

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
			imgH := (projectedPt[1] + float64(w)/float64(h)) * float64(h) / 2

			normalizedDistance := 1.0 / math.Pow((pd.distance+1.0), .3)
			if math.IsNaN(normalizedDistance) {
				normalizedDistance = .01
			}

			red := normalizedDistance
			blue := 1.0 - normalizedDistance
			green := 0.0

			dc.SetRGB(red, green, blue)

			size := 2 + (10-2)*normalizedDistance

			dc.DrawCircle(imgW, imgH, size)
			dc.Fill()
		}
	}

	// Finally, render the indicator points where lines pass through the screen
	dc.SetRGB(0.3, 0.3, 0.3) // Set indicator points color to gray
	for _, indicator := range lineThroughScreenIndicators {
		imgW := float64(indicator[0]+1) * float64(w) / 2
		imgH := (indicator[1] + float64(w)/float64(h)) * float64(h) / 2

		dc.DrawCircle(imgW, imgH, 4) // Draw small circles as indicators
		dc.Fill()
	}

	// Render additional information (text overlay)
	midpoint := s.camera.screen.TL.Add(s.camera.screen.BR).Scale(0.5)
	rotationAngles := s.camera.screen.TL.Sub(s.camera.screen.TR)
	angleX := (int(math.Atan2(rotationAngles[1], rotationAngles[0])*(180/math.Pi)+360) % 360) - 180
	angleY := (int(math.Atan2(rotationAngles[2], rotationAngles[0])*(180/math.Pi)+360) % 360) - 180

	textPadding := 10.0
	textHeight := 20.0

	dc.SetRGB(1, 1, 1)
	dc.DrawStringAnchored(fmt.Sprintf("Midpoint: %v", midpoint), textPadding, float64(h)-textPadding-textHeight-20, 0, 1)
	dc.DrawStringAnchored(fmt.Sprintf("Focus: %v", s.camera.focus), textPadding, float64(h)-textPadding-20, 0, 1)
	dc.DrawStringAnchored(fmt.Sprintf("Angle X: %d°, Angle Y: %d°", angleX, angleY), textPadding, float64(h)-textPadding-2*textHeight-20, 0, 1)
	dc.DrawStringAnchored(fmt.Sprintf("Orth: %t", s.camera.orth), textPadding, float64(h)-textPadding-3*textHeight-20, 0, 1)

	dc.Fill()
}
