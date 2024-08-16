package main

import (
	"fmt"
	"image"
	"math"
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

	// Set the background color to black and clear the buffer
	dc.SetRGB(0, 0, 0) // Black background
	dc.Clear()         // Clear the context with the current color

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
		// distance := float64(normalizedPt[2])
		distance := normalizedPt.Sub(normCamera.focus).Length() - normCamera.focus.Length()

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
			green := 0.0 // No green component to stay between red and purple

			dc.SetRGB(red, green, blue) // Interpolate between red and purple

			// Interpolate size: 10 for close objects, decreasing to 2 for distant objects
			size := 2 + (10-2)*normalizedDistance

			dc.DrawCircle(imgW, imgH, size) // Draw a circle with interpolated size
			dc.Fill()                       // Fill the drawn circle with the current color
		}
	}

	// Calculate the midpoint of the screen
	midpoint := s.camera.screen.TL.Add(s.camera.screen.BR).Scale(0.5)

	// Current rotation angles
	rotationAngles := s.camera.screen.TL.Sub(s.camera.screen.TR)
	angleX := (int(math.Atan2(rotationAngles[1], rotationAngles[0])*(180/math.Pi)+360) % 360) - 180
	angleY := (int(math.Atan2(rotationAngles[2], rotationAngles[0])*(180/math.Pi)+360) % 360) - 180

	// Current zoom (assumed as the distance from focus to screen center)
	currentZoom := midpoint.Sub(s.camera.focus).Length()

	// Calculate text position starting at the bottom left
	textPadding := 10.0
	textHeight := 20.0

	// Display zoom at the bottom left
	dc.SetRGB(1, 1, 1) // Set color to white for the text
	dc.DrawStringAnchored(fmt.Sprintf("Zoom: %.2f", currentZoom), textPadding, float64(h)-textPadding-20, 0, 1)

	// Display midpoint one row above the zoom
	dc.DrawStringAnchored(fmt.Sprintf("Midpoint: %v", midpoint), textPadding, float64(h)-textPadding-textHeight-20, 0, 1)

	// Display rotation angles one row above the midpoint
	dc.DrawStringAnchored(fmt.Sprintf("Angle X: %d°, Angle Y: %d°", angleX, angleY), textPadding, float64(h)-textPadding-2*textHeight-20, 0, 1)

	dc.Fill()

}
