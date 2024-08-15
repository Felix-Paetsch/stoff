package main

import (
	"log"
	"math"
)

type Screen struct {
	TL Vec
	BL Vec
	BR Vec
	TR Vec
}

type Camera struct {
	screen Screen
	focus  Vec
}

type ProjectionPosition int

const (
	InsideFront ProjectionPosition = iota
	InsideBehind
	OutsideFront
	OutsideBehind
)

func NormalizeVec(screen Screen) func(Vec) Vec {
	center := screen.TL.Add(screen.BR).Scale(.5)

	source_TL := screen.TL.Sub(center)
	source_BL := screen.BL.Sub(center)
	mat_input := Mat{
		source_TL,
		source_BL,
		screen.TL.Cross(screen.BL),
	}

	target_TL := Vec{-1, 1, 0}
	target_BL := Vec{-1, -1, 0}

	mat_output := Mat{
		target_TL,
		target_BL,
		target_TL.Cross(target_BL),
	}

	inv, err := solveLGS(mat_input, mat_output)
	if err != nil {
		log.Fatal(err)
	}

	return func(v Vec) Vec {
		translated_vec := v.Sub(center)
		return inv.MulVec(translated_vec)
	}
}

func (p ProjectionPosition) String() string {
	return [...]string{"InsideFront", "InsideBehind", "OutsideFront", "OutsideBehind"}[p]
}

// isPointInScreen checks if a given point `p` lies within the 2D rectangle
// defined by the screen's corners. It assumes that the point `p` is in the
// same plane as the screen.
// The function uses barycentric coordinates to determine if the point is
// within the bounds of the screen's local coordinate system.
//
// Parameters:
// - p: The Vec representing the point to check.
//
// Returns:
// - bool: true if the point is inside the rectangle, false otherwise.
func (s Screen) isPointInScreen(p Vec) bool {
	// Compute vectors relative to the top-left corner
	v0 := s.TR.Sub(s.TL) // Vector along the top edge
	v1 := s.BL.Sub(s.TL) // Vector along the left edge
	v2 := p.Sub(s.TL)    // Vector from TL to the point

	// Calculate dot products
	dot00 := v0.Dot(v0) // Length squared of top edge
	dot01 := v0.Dot(v1) // Dot product of top edge and left edge
	dot02 := v0.Dot(v2) // Dot product of top edge and vector to point
	dot11 := v1.Dot(v1) // Length squared of left edge
	dot12 := v1.Dot(v2) // Dot product of left edge and vector to point

	// Calculate barycentric coordinates (u, v)
	invDenom := 1 / (dot00*dot11 - dot01*dot01)
	u := (dot11*dot02 - dot01*dot12) * invDenom
	v := (dot00*dot12 - dot01*dot02) * invDenom

	// Check if the point is inside the rectangle
	return (u >= 0) && (v >= 0) && (u <= 1) && (v <= 1)
}

// ============== Camera Movement

func (c Camera) Move(delta Vec) Camera {
	c.focus = c.focus.Add(delta)
	c.screen.TL = c.screen.TL.Add(delta)
	c.screen.BL = c.screen.BL.Add(delta)
	c.screen.TR = c.screen.TR.Add(delta)
	c.screen.BR = c.screen.BR.Add(delta)
	return c
}

func (c Camera) Rotate(angles Vec) Camera {
	// Get rotation matrices for X, Y, Z
	rotationX := Mat{
		Vec{1, 0, 0},
		Vec{0, float32(math.Cos(float64(angles[0]))), -float32(math.Sin(float64(angles[0])))},
		Vec{0, float32(math.Sin(float64(angles[0]))), float32(math.Cos(float64(angles[0])))},
	}

	rotationY := Mat{
		Vec{float32(math.Cos(float64(angles[1]))), 0, float32(math.Sin(float64(angles[1])))},
		Vec{0, 1, 0},
		Vec{-float32(math.Sin(float64(angles[1]))), 0, float32(math.Cos(float64(angles[1])))},
	}

	rotationZ := Mat{
		Vec{float32(math.Cos(float64(angles[2]))), -float32(math.Sin(float64(angles[2]))), 0},
		Vec{float32(math.Sin(float64(angles[2]))), float32(math.Cos(float64(angles[2]))), 0},
		Vec{0, 0, 1},
	}

	// Combine the rotations (assuming one angle is 0, the order doesn't matter)
	rotationMatrix := rotationX.MulMat(rotationY).MulMat(rotationZ)

	// Translate screen points to origin (relative to focus), rotate, and translate back
	rotatePoint := func(p Vec) Vec {
		relative := p.Sub(c.focus)
		rotated := rotationMatrix.MulVec(relative)
		return rotated.Add(c.focus)
	}

	c.screen.TL = rotatePoint(c.screen.TL)
	c.screen.BL = rotatePoint(c.screen.BL)
	c.screen.TR = rotatePoint(c.screen.TR)
	c.screen.BR = rotatePoint(c.screen.BR)

	return c
}

func (c Camera) Zoom(percentage float32) Camera {
	// Calculate the center of the screen
	center := c.screen.TL.Add(c.screen.BR).Scale(0.5)

	// Calculate the vector from the focus point to the center
	direction := center.Sub(c.focus)

	// Calculate the current distance from the focus point to the center
	currentDistance := direction.Length()

	// Calculate the diagonal length of the screen
	screenDiagonal := c.screen.TL.Sub(c.screen.BR).Length()

	// Calculate the new distance after applying the zoom percentage
	newDistance := currentDistance * (1 + percentage/100)

	// Clamp the new distance between 0.5 and 10 times the screen diagonal
	if newDistance < 0.5*screenDiagonal {
		newDistance = 0.5 * screenDiagonal
	} else if newDistance > 10*screenDiagonal {
		newDistance = 10 * screenDiagonal
	}

	// Calculate the new focus point
	newFocus := center.Sub(direction.Scale(newDistance / currentDistance))

	// Update the camera's focus point
	c.focus = newFocus

	return c
}

func (c Camera) Normalize() Camera {
	// Define the new normalized screen
	newScreen := Screen{
		TL: Vec{-1, 1, 0},
		BL: Vec{-1, -1, 0},
		BR: Vec{1, -1, 0},
		TR: Vec{1, 1, 0},
	}

	// Calculate the diagonal length of the original screen
	originalDiagonal := c.screen.TL.Sub(c.screen.BR).Length()

	// Calculate the diagonal length of the new screen (which is sqrt(8) due to points at (-1,1) etc.)
	newDiagonal := float32(math.Sqrt(8))

	// Scale factor to maintain the same relative distance
	scaleFactor := originalDiagonal / newDiagonal

	// Calculate the new focus point along the z-axis to maintain the scale
	newFocusZ := -scaleFactor * (c.focus.Sub(c.screen.TL).Length() / originalDiagonal)

	// Create the new normalized camera
	newCamera := Camera{
		screen: newScreen,
		focus:  Vec{0, 0, newFocusZ},
	}

	return newCamera
}

func (c Camera) Project(v Vec) (Vec, ProjectionPosition) {
	// Calculate the normal to the screen (plane)
	normal := c.screen.TR.Sub(c.screen.TL).Cross(c.screen.BL.Sub(c.screen.TL))

	// Calculate the parameter t for the line equation P = focus + t(v - focus)
	focusToV := v.Sub(c.focus)
	denominator := normal.Dot(focusToV)

	if denominator == 0 {
		// Focus = V or Focus - V is parallel to plane
		return c.focus, OutsideFront
	}

	t := normal.Dot(c.screen.TL.Sub(c.focus)) / denominator

	// Compute the projection point P = focus + t(v - focus)
	projection := c.focus.Add(focusToV.Scale(t))
	inScreen := c.screen.isPointInScreen(projection)

	// Determine the ProjectionPosition
	var position ProjectionPosition
	if inScreen {
		if t >= 0 {
			position = InsideFront
		} else {
			position = InsideBehind
		}
	} else {
		if t >= 0 {
			position = OutsideFront
		} else {
			position = OutsideBehind
		}
	}

	return projection, position
}

func DefaultCamera() Camera {
	// Define the default normalized screen
	defaultScreen := Screen{
		TL: Vec{-1, 1, 0},
		BL: Vec{-1, -1, 0},
		BR: Vec{1, -1, 0},
		TR: Vec{1, 1, 0},
	}

	// Define the default focus point
	defaultFocus := Vec{0, 0, -5}

	// Create and return the default camera
	return Camera{
		screen: defaultScreen,
		focus:  defaultFocus,
	}
}
