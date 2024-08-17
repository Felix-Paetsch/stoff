package main

import (
	"fmt"
	"log"
	"math"

	"golang.org/x/mobile/event/key"
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
		source_TL.Cross(source_BL),
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

func (s Screen) isPointInScreen(p Vec) bool {
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

func (c *Camera) Move(delta Vec) *Camera {
	c.focus = c.focus.Add(delta)
	c.screen.TL = c.screen.TL.Add(delta)
	c.screen.BL = c.screen.BL.Add(delta)
	c.screen.TR = c.screen.TR.Add(delta)
	c.screen.BR = c.screen.BR.Add(delta)
	return c
}

func (c *Camera) Rotate(angles Vec) *Camera {
	rotationX := Mat{
		Vec{1, 0, 0},
		Vec{0, float64(math.Cos(float64(angles[0]))), -float64(math.Sin(float64(angles[0])))},
		Vec{0, float64(math.Sin(float64(angles[0]))), float64(math.Cos(float64(angles[0])))},
	}

	rotationY := Mat{
		Vec{float64(math.Cos(float64(angles[1]))), 0, float64(math.Sin(float64(angles[1])))},
		Vec{0, 1, 0},
		Vec{-float64(math.Sin(float64(angles[1]))), 0, float64(math.Cos(float64(angles[1])))},
	}

	rotationMatrix := rotationX.MulMat(rotationY)

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

func (c *Camera) Zoom(percentage float64) *Camera {
	center := c.screen.TL.Add(c.screen.BR).Scale(0.5)
	direction := center.Sub(c.focus)
	currentDistance := direction.Length()
	screenDiagonal := c.screen.TL.Sub(c.screen.BR).Length()
	newDistance := currentDistance * (1 + percentage/100)

	if newDistance < 0.5*screenDiagonal {
		newDistance = 0.5 * screenDiagonal
	} else if newDistance > 30*screenDiagonal {
		newDistance = 30 * screenDiagonal
	}

	newFocus := center.Sub(direction.Scale(newDistance / currentDistance))
	c.focus = newFocus

	return c
}

func (c *Camera) Normalize() *Camera {
	newScreen := Screen{
		TL: Vec{-1, 1, 0},
		BL: Vec{-1, -1, 0},
		BR: Vec{1, -1, 0},
		TR: Vec{1, 1, 0},
	}

	return &Camera{
		screen: newScreen,
		focus:  NormalizeVec(c.screen)(c.focus),
	}
}

func (c *Camera) Project(v Vec) (Vec, ProjectionPosition) {
	normal := c.screen.TR.Sub(c.screen.TL).Cross(c.screen.BL.Sub(c.screen.TL))
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

func (c *Camera) Update(width, height int) {
	aspectRatio := float64(width) / float64(height)

	LRVec := c.screen.TR.Sub(c.screen.TL)
	TBVec := c.screen.BL.Sub(c.screen.TL).Normalize().Scale(LRVec.Length() / aspectRatio)

	oldCenter := c.screen.TR.Add(c.screen.BL).Scale(.5)
	oldDiag := c.screen.TR.Sub(c.screen.BL).Length()
	focusVec := c.focus.Sub(oldCenter)

	c.screen.TR = c.screen.TL.Add(LRVec)
	c.screen.BL = c.screen.TL.Add(TBVec)
	c.screen.BR = c.screen.TL.Add(TBVec).Add(LRVec)

	newCenter := c.screen.TR.Add(c.screen.BL).Scale(.5)
	newDiag := c.screen.TR.Sub(c.screen.BL).Length()
	c.focus = newCenter.Add(focusVec.Scale(newDiag / oldDiag))
}

func DefaultCamera(aspectRatio float64) *Camera {
	defaultScreen := Screen{
		TL: Vec{-1, -aspectRatio, 0},
		BL: Vec{-1, aspectRatio, 0},
		BR: Vec{1, aspectRatio, 0},
		TR: Vec{1, -aspectRatio, 0},
	}

	defaultFocus := Vec{0, 0, -100}

	return &Camera{
		screen: defaultScreen,
		focus:  defaultFocus,
	}
}

func (s Screen) String() string {
	return fmt.Sprintf("Screen{\n  TL: %v,\n  BL: %v,\n  BR: %v,\n  TR: %v\n}", s.TL, s.BL, s.BR, s.TR)
}

func (c *Camera) String() string {
	return fmt.Sprintf("Camera{\n  Screen: %v,\n  Focus: %v\n}", c.screen, c.focus)
}

func (c *Camera) ReactToKeypresses(keys map[key.Code]bool, dt float64) *Camera {
	const (
		MoveSpeed   = 3.0
		RotateSpeed = 0.2
		ZoomSpeed   = 20.0
	)

	dt = min(dt, float64(.2))

	moveVec := Vec{0, 0, 0}
	rotateVec := Vec{0, 0, 0}

	if keys[key.CodeA] {
		moveVec = moveVec.Add(Vec{-MoveSpeed * dt, 0, 0})
	}
	if keys[key.CodeD] {
		moveVec = moveVec.Add(Vec{MoveSpeed * dt, 0, 0})
	}
	if keys[key.CodeS] {
		moveVec = moveVec.Add(Vec{0, MoveSpeed * dt, 0})
	}
	if keys[key.CodeW] {
		moveVec = moveVec.Add(Vec{0, -MoveSpeed * dt, 0})
	}
	if keys[key.CodeY] {
		moveVec = moveVec.Add(Vec{0, 0, MoveSpeed * dt})
	}
	if keys[key.CodeX] {
		moveVec = moveVec.Add(Vec{0, 0, -MoveSpeed * dt})
	}

	if keys[key.CodeJ] {
		rotateVec = rotateVec.Add(Vec{0, RotateSpeed * dt, 0})
	}
	if keys[key.CodeL] {
		rotateVec = rotateVec.Add(Vec{0, -RotateSpeed * dt, 0})
	}
	if keys[key.CodeK] {
		rotateVec = rotateVec.Add(Vec{RotateSpeed * dt, 0, 0})
	}
	if keys[key.CodeI] {
		rotateVec = rotateVec.Add(Vec{-RotateSpeed * dt, 0, 0})
	}

	c = c.Move(moveVec)
	c = c.Rotate(rotateVec)

	if keys[key.CodeC] {
		c = c.Zoom(ZoomSpeed * dt)
	} else if keys[key.CodeV] {
		c = c.Zoom(-ZoomSpeed * dt)
	}

	if keys[key.CodeR] {
		w := c.screen.TL.Sub(c.screen.TR).Length()
		h := c.screen.TL.Sub(c.screen.BL).Length()
		c = DefaultCamera(w / h)
	}

	return c
}
