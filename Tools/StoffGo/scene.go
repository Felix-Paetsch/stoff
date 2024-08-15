package main

import (
	"image"
	"sort"

	"github.com/fogleman/gg"
)

type Scene struct {
	camera Camera
	points []Vec
}

func (s *Scene) Point(p Vec) {
	s.points = append(s.points, p)
}

func (s Scene) Render(img *image.RGBA, w, h int) {
	dc := gg.NewContextForRGBA(img) // Create a new context for the image

	// Set the background color and clear the buffer
	dc.SetRGB(0, 0, 0.5) // Dark blue background
	dc.Clear()           // Clear the context with the current color

	normalize := NormalizeVec(s.camera.screen)
	normCamera := s.camera.Normalize()

	// Create a slice to hold the necessary data for each point
	type pointData struct {
		normalizedPoint Vec
		distance        float64
	}

	var pointsData []pointData
	for _, pt := range s.points {
		// Normalize the point
		normalizedPt := normalize(pt)

		// Compute the distance based on z-value of the normalized point
		distance := float64(normalizedPt[2])

		pointsData = append(pointsData, pointData{
			normalizedPoint: normalizedPt,
			distance:        distance,
		})
	}

	// Sort the points by distance (far to near)
	sort.Slice(pointsData, func(i, j int) bool {
		return pointsData[i].distance > pointsData[j].distance
	})

	// Render the points to the buffer
	for _, pd := range pointsData {
		projectedPt, projectionPos := normCamera.Project(pd.normalizedPoint)

		if projectionPos == InsideFront {
			imgW := float64(projectedPt[0]+1) * float64(w) / 2
			imgH := float64(projectedPt[1]+1) * float64(h) / 2

			// Calculate color based on 1/distance interpolation
			normalizedDistance := 1.0 / (pd.distance + 1.0)
			red := normalizedDistance
			blue := 1.0 - normalizedDistance

			dc.SetRGB(red, 0, blue)       // Interpolate between red and blue
			dc.DrawCircle(imgW, imgH, 10) // Draw a circle with radius 10
			dc.Fill()                     // Fill the drawn circle with the current color
		}
	}
}
