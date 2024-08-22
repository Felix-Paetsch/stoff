package main

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"os"

	"github.com/netgusto/poly2tri-go"
)

func main() {
	// Define the outer boundary of the polygon
	topP := poly2tri.NewPoint(0, 0)
	rightP := poly2tri.NewPoint(9.5, 5)
	bottomP := poly2tri.NewPoint(0, 10)

	contour := []*poly2tri.Point{
		topP,
		poly2tri.NewPoint(10, 0),
		poly2tri.NewPoint(10, 10),
		bottomP,
	}

	// Initialize the SweepContext with the outer contour
	swctx := poly2tri.NewSweepContext(contour, false)

	swctx.AddPoints([]*poly2tri.Point{
		poly2tri.NewPoint(4.5, 4.5),
		poly2tri.NewPoint(5.5, 4.5),
		poly2tri.NewPoint(5.5, 5.5),
		poly2tri.NewPoint(6.5, 5.5),
		rightP,
	})

	swctx.EdgeList = append(
		swctx.EdgeList,
		poly2tri.NewEdge(topP, rightP),
	)

	// Perform the triangulation
	swctx.Triangulate()

	// Retrieve the resulting triangles
	triangles := swctx.GetTriangles()

	// Print the triangles
	for _, t := range triangles {
		fmt.Printf("Triangle: %v, %v, %v\n", t.Points[0], t.Points[1], t.Points[2])
	}

	// Draw and save the triangulation to an image
	DrawTriangulation(triangles, "triangulation.png", 500, 500)
}

// DrawTriangulation draws the triangulation to an image and saves it to a file.
func DrawTriangulation(triangles []*poly2tri.Triangle, filename string, width, height int) {
	// Create a new blank image
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	white := color.RGBA{255, 255, 255, 255}
	black := color.RGBA{0, 0, 0, 255}

	// Fill the image with a white background
	draw.Draw(img, img.Bounds(), &image.Uniform{white}, image.Point{}, draw.Src)

	// Function to scale the points to fit the image size
	scale := func(p *poly2tri.Point) (int, int) {
		return int(p.X * float64(width) / 10), int(p.Y * float64(height) / 10)
	}

	// Draw the triangles
	for _, t := range triangles {
		// Scale and unpack points
		x0, y0 := scale(t.Points[0])
		x1, y1 := scale(t.Points[1])
		x2, y2 := scale(t.Points[2])

		// Draw edges of the triangle
		drawLine(img, image.Point{X: x0, Y: y0}, image.Point{X: x1, Y: y1}, black)
		drawLine(img, image.Point{X: x1, Y: y1}, image.Point{X: x2, Y: y2}, black)
		drawLine(img, image.Point{X: x2, Y: y2}, image.Point{X: x0, Y: y0}, black)
	}

	// Save the image to a file
	outputFile, err := os.Create(filename)
	if err != nil {
		fmt.Println("Error creating image file:", err)
		return
	}
	defer outputFile.Close()

	png.Encode(outputFile, img)
	fmt.Printf("Saved triangulation image to %s\n", filename)
}

// drawLine draws a line on the image using Bresenham's algorithm.
func drawLine(img *image.RGBA, p1, p2 image.Point, col color.Color) {
	// Bresenham's line algorithm
	dx := abs(p2.X - p1.X)
	dy := abs(p2.Y - p1.Y)
	sx, sy := 1, 1
	if p1.X > p2.X {
		sx = -1
	}
	if p1.Y > p2.Y {
		sy = -1
	}
	err := dx - dy

	for {
		img.Set(p1.X, p1.Y, col)
		if p1.X == p2.X && p1.Y == p2.Y {
			break
		}
		e2 := err * 2
		if e2 > -dy {
			err -= dy
			p1.X += sx
		}
		if e2 < dx {
			err += dx
			p1.Y += sy
		}
	}
}

// abs returns the absolute value of an integer.
func abs(x int) int {
	if x < 0 {
		return -x
	}
	return x
}
