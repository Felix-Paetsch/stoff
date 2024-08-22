package render

import (
	"fmt"
	"log"
	"math"
	"stoffgo/config"
	G "stoffgo/geometry"

	"golang.org/x/mobile/event/key"
)

type Screen struct {
	TL G.Vec
	BL G.Vec
	BR G.Vec
	TR G.Vec
}

type Camera struct {
	screen Screen
	focus  G.Vec
	orth   bool
}

type ProjectionPosition int

const (
	InsideFront ProjectionPosition = iota
	InsideBehind
	OutsideFront
	OutsideBehind
)

func NormalizeVec(screen Screen) func(G.Vec) G.Vec {
	center := screen.TL.Add(screen.BR).Scale(.5)

	source_TL := screen.TL.Sub(center)
	source_BL := screen.BL.Sub(center)
	mat_input := G.Mat{
		source_TL,
		source_BL,
		source_TL.Cross(source_BL),
	}

	target_TL := G.Vec{-1, 1, 0}
	target_BL := G.Vec{-1, -1, 0}

	mat_output := G.Mat{
		target_TL,
		target_BL,
		target_TL.Cross(target_BL),
	}

	inv, err := G.SolveLGS(mat_input, mat_output)
	if err != nil {
		log.Fatal(err)
	}

	return func(v G.Vec) G.Vec {
		translated_Vec := v.Sub(center)
		return inv.MulVec(translated_Vec)
	}
}

func (p ProjectionPosition) String() string {
	return [...]string{"InsideFront", "InsideBehind", "OutsideFront", "OutsideBehind"}[p]
}

func (s Screen) isPointInScreen(p G.Vec) bool {
	v0 := s.TR.Sub(s.TL)
	v1 := s.BL.Sub(s.TL)
	v2 := p.Sub(s.TL)

	dot00 := v0.Dot(v0)
	dot01 := v0.Dot(v1)
	dot02 := v0.Dot(v2)
	dot11 := v1.Dot(v1)
	dot12 := v1.Dot(v2)

	invDenom := 1 / (dot00*dot11 - dot01*dot01)
	u := (dot11*dot02 - dot01*dot12) * invDenom
	v := (dot00*dot12 - dot01*dot02) * invDenom

	return (u >= 0) && (v >= 0) && (u <= 1) && (v <= 1)
}

func (c *Camera) Move(delta G.Vec) *Camera {
	c.focus = c.focus.Add(delta)
	c.screen.TL = c.screen.TL.Add(delta)
	c.screen.BL = c.screen.BL.Add(delta)
	c.screen.TR = c.screen.TR.Add(delta)
	c.screen.BR = c.screen.BR.Add(delta)
	return c
}

func (c *Camera) Rotate(angles G.Vec) *Camera {
	rotationX := G.Mat{
		G.Vec{1, 0, 0},
		G.Vec{0, float64(math.Cos(float64(angles[0]))), -float64(math.Sin(float64(angles[0])))},
		G.Vec{0, float64(math.Sin(float64(angles[0]))), float64(math.Cos(float64(angles[0])))},
	}

	rotationY := G.Mat{
		G.Vec{float64(math.Cos(float64(angles[1]))), 0, float64(math.Sin(float64(angles[1])))},
		G.Vec{0, 1, 0},
		G.Vec{-float64(math.Sin(float64(angles[1]))), 0, float64(math.Cos(float64(angles[1])))},
	}

	rotationMatrix := rotationX.MulMat(rotationY)

	rotatePoint := func(p G.Vec) G.Vec {
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

func (c *Camera) MoveFocus(percentage float64) *Camera {
	center := c.screen.TL.Add(c.screen.BR).Scale(0.5)
	direction := center.Sub(c.focus)
	currentDistance := direction.Length()
	screenDiagonal := c.screen.TL.Sub(c.screen.BR).Length()
	newDistance := currentDistance * (1 + percentage/100)

	if newDistance < 0.5*screenDiagonal {
		newDistance = 0.5 * screenDiagonal
	}

	newFocus := center.Sub(direction.Scale(newDistance / currentDistance))
	c.focus = newFocus

	return c
}

func (c *Camera) Zoom(percentage float64) *Camera {
	LRGVec := c.screen.TR.Sub(c.screen.TL)
	TDGVec := c.screen.BR.Sub(c.screen.TR)
	center := c.screen.TR.Add(c.screen.BL).Scale(.5)

	aspectRatio := LRGVec.Length() / TDGVec.Length()
	new_width := (1 - percentage) * LRGVec.Length()

	new_width = max(new_width, .2)
	newLRGVec := LRGVec.Normalize().Scale(new_width)
	newTDGVec := TDGVec.Normalize().Scale(new_width / aspectRatio)

	c.screen.TL = center.Sub(newLRGVec.Add(newTDGVec).Scale(.5))
	c.screen.BL = center.Sub(newLRGVec.Sub(newTDGVec).Scale(.5))
	c.screen.BR = center.Add(newLRGVec.Add(newTDGVec).Scale(.5))
	c.screen.TR = center.Add(newLRGVec.Sub(newTDGVec).Scale(.5))
	c.MoveFocus(0) // Clip Focus

	return c
}

func (c *Camera) Normalize() *Camera {
	newScreen := Screen{
		TL: G.Vec{-1, 1, 0},
		BL: G.Vec{-1, -1, 0},
		BR: G.Vec{1, -1, 0},
		TR: G.Vec{1, 1, 0},
	}

	return &Camera{
		screen: newScreen,
		focus:  NormalizeVec(c.screen)(c.focus),
		orth:   c.orth,
	}
}

func (c *Camera) Project(v G.Vec) (G.Vec, ProjectionPosition) {
	normal := c.screen.TR.Sub(c.screen.TL).Cross(c.screen.BL.Sub(c.screen.TL)).Normalize()

	if !c.orth {
		// Perspective projection
		focusToV := v.Sub(c.focus)
		denominator := normal.Dot(focusToV)

		if denominator == 0 {
			return c.focus, OutsideFront
		}

		t := normal.Dot(c.screen.TL.Sub(c.focus)) / denominator
		projection := c.focus.Add(focusToV.Scale(t))
		inScreen := c.screen.isPointInScreen(projection)

		var position ProjectionPosition
		if inScreen {
			if t >= 0 && t <= 1 {
				position = InsideFront
			} else {
				position = InsideBehind
			}
		} else {
			if t >= 0 && t <= 1 {
				position = OutsideFront
			} else {
				position = OutsideBehind
			}
		}

		return projection, position
	}

	// Orthogonal projection
	// Calculate distance from the point to the screen plane
	d := normal.Dot(c.screen.TL) // Distance from origin to screen plane
	distanceToPlane := normal.Dot(v) - d
	projection := v.Sub(normal.Scale(distanceToPlane / normal.Dot(normal)))

	// Determine if the projection point is inside the screen bounds
	inScreen := c.screen.isPointInScreen(projection)

	// Determine the position
	var position ProjectionPosition
	if inScreen {
		if distanceToPlane > 0 {
			position = InsideFront
		} else {
			position = InsideBehind
		}
	} else {
		if distanceToPlane > 0 {
			position = OutsideFront
		} else {
			position = OutsideBehind
		}
	}

	return projection, position
}

func (c *Camera) Update(width, height int) {
	aspectRatio := float64(width) / float64(height)

	LRGVec := c.screen.TR.Sub(c.screen.TL)
	TBGVec := c.screen.BL.Sub(c.screen.TL).Normalize().Scale(LRGVec.Length() / aspectRatio)

	oldCenter := c.screen.TR.Add(c.screen.BL).Scale(.5)
	oldDiag := c.screen.TR.Sub(c.screen.BL).Length()
	focusVec := c.focus.Sub(oldCenter)

	c.screen.TR = c.screen.TL.Add(LRGVec)
	c.screen.BL = c.screen.TL.Add(TBGVec)
	c.screen.BR = c.screen.TL.Add(TBGVec).Add(LRGVec)

	newCenter := c.screen.TR.Add(c.screen.BL).Scale(.5)
	newDiag := c.screen.TR.Sub(c.screen.BL).Length()
	c.focus = newCenter.Add(focusVec.Scale(newDiag / oldDiag))
}

func DefaultCamera(aspectRatio float64) *Camera {
	w2 := config.C.CameraDefaults.Width / 2
	mp := config.C.CameraDefaults.Midpoint
	f := config.C.CameraDefaults.Focus
	r := config.C.CameraDefaults.Rotation

	defaultScreen := Screen{
		TL: G.Vec{-w2, -aspectRatio * w2, 0}.Add(mp),
		BL: G.Vec{-w2, aspectRatio * w2, 0}.Add(mp),
		BR: G.Vec{w2, aspectRatio * w2, 0}.Add(mp),
		TR: G.Vec{w2, -aspectRatio * w2, 0}.Add(mp),
	}

	tempCam := &Camera{
		screen: defaultScreen,
		focus:  G.Vec{0, 0, -f}.Add(mp),
		orth:   config.C.CameraDefaults.Orth,
	}

	return tempCam.Rotate(r)
}

func (s Screen) String() string {
	return fmt.Sprintf("Screen{\n  TL: %v,\n  BL: %v,\n  BR: %v,\n  TR: %v\n}", s.TL, s.BL, s.BR, s.TR)
}

func (c *Camera) String() string {
	return fmt.Sprintf("Camera{\n  Screen: %v,\n  Focus: %v\n, Orth: %t\n}", c.screen, c.focus, c.orth)
}

func (c *Camera) ReactToKeypresses(keys map[key.Code]bool, dt float64) *Camera {
	var (
		MoveSpeed   = config.C.CameraMovement.MoveSpeed
		RotateSpeed = config.C.CameraMovement.RotateSpeed
		ZoomSpeed   = config.C.CameraMovement.ZoomSpeed
		FocusSpeec  = config.C.CameraMovement.FocusSpeed
	)

	dt = min(dt, float64(.2))

	if keys[key.CodeR] {
		w := c.screen.TL.Sub(c.screen.TR).Length()
		h := c.screen.TL.Sub(c.screen.BL).Length()
		return DefaultCamera(w / h)
	}

	moveVec := G.Vec{0, 0, 0}
	rotateVec := G.Vec{0, 0, 0}

	if keys[key.CodeA] {
		moveVec = moveVec.Add(G.Vec{-MoveSpeed * dt, 0, 0})
	}
	if keys[key.CodeD] {
		moveVec = moveVec.Add(G.Vec{MoveSpeed * dt, 0, 0})
	}
	if keys[key.CodeS] {
		moveVec = moveVec.Add(G.Vec{0, -MoveSpeed * dt, 0})
	}
	if keys[key.CodeW] {
		moveVec = moveVec.Add(G.Vec{0, MoveSpeed * dt, 0})
	}
	if keys[key.CodeY] {
		moveVec = moveVec.Add(G.Vec{0, 0, MoveSpeed * dt})
	}
	if keys[key.CodeX] {
		moveVec = moveVec.Add(G.Vec{0, 0, -MoveSpeed * dt})
	}

	if keys[key.CodeJ] {
		rotateVec = rotateVec.Add(G.Vec{0, RotateSpeed * dt, 0})
	}
	if keys[key.CodeL] {
		rotateVec = rotateVec.Add(G.Vec{0, -RotateSpeed * dt, 0})
	}
	if keys[key.CodeK] {
		rotateVec = rotateVec.Add(G.Vec{RotateSpeed * dt, 0, 0})
	}
	if keys[key.CodeI] {
		rotateVec = rotateVec.Add(G.Vec{-RotateSpeed * dt, 0, 0})
	}

	if keys[key.CodeO] {
		c.orth = !c.orth
	}

	c = c.Move(moveVec)
	c = c.Rotate(rotateVec)

	if keys[key.CodeT] {
		c = c.MoveFocus(FocusSpeec * dt)
	} else if keys[key.CodeZ] {
		c = c.MoveFocus(-FocusSpeec * dt)
	}

	if keys[key.CodeC] {
		c = c.Zoom(ZoomSpeed * dt)
	} else if keys[key.CodeV] {
		c = c.Zoom(-ZoomSpeed * dt)
	}

	return c
}