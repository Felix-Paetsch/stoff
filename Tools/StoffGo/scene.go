package main

import (
	"fmt"
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

func (s Scene) Render(fp string, w, h int) {
	dc := gg.NewContext(w, h)
	dc.SetRGB(0, 0, .5) // Set background color to a dark blue shade
	dc.Clear()          // Clear the context with the current color

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
		fmt.Println(pt)
		fmt.Println(normalizedPt)
		fmt.Println("=====")

		// Compute the distance from the normalized point to the focus point of the normalized camera
		// Option 1: Distance based on 3D distance to the focus point
		// distance := float64(normalizedPt.Sub(normCamera.focus).Length())

		// Option 2: Distance based purely on the z-value of the normalized point
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

	// Render the points
	for _, pd := range pointsData {
		projectedPt, projectionPos := normCamera.Project(pd.normalizedPoint)

		if projectionPos == InsideFront {
			imgW := float64(projectedPt[0]+1) * float64(w) / 2
			imgH := float64(projectedPt[1]+1) * float64(h) / 2

			// Calculate color based on 1/distance interpolation
			// Closer points will be red (distance near 0), farther will be blue
			normalizedDistance := 1.0 / (pd.distance + 1.0) // Adding 1 to avoid division by zero
			red := normalizedDistance
			blue := 1.0 - normalizedDistance

			dc.SetRGB(red, 0, blue) // Interpolate between red and blue
			dc.DrawCircle(imgW, imgH, 10)
			dc.Fill() // Fill the drawn circle
		}
	}

	dc.SavePNG(fp) // Save the rendered image to the specified file path
}
