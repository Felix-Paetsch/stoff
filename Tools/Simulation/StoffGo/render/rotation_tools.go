package render

import (
	"log"
	"math"
	G "stoffgo/geometry"
)

func canonicalTransformations(s Screen) (func(v G.Vec) G.Vec, func(v G.Vec) G.Vec) {
	canonicalCenter := s.BL
	translate := func(v G.Vec) G.Vec {
		return v.Sub(canonicalCenter)
	}

	translateInv := func(v G.Vec) G.Vec {
		return v.Add(canonicalCenter)
	}

	mat_src := G.Mat{
		translate(s.TL),
		translate(s.BR),
		translate(s.TL).Cross(translate(s.BR)),
	}

	aspect_ratio := s.TL.Distance(s.TR) / s.TL.Distance(s.BL)
	width := s.TL.Distance(s.BL)
	height := width / aspect_ratio
	target_TL := G.Vec{width, 0, 0}
	target_BR := G.Vec{0, height, 0}
	cross := target_TL.Cross(target_BR)

	mat_target := G.Mat{
		target_TL,
		target_BR,
		cross,
	}

	CoeffMat, err := G.MatFromInputOutput(mat_src, mat_target)
	if err != nil {
		log.Fatal(err)
	}

	toCanonical := func(v G.Vec) G.Vec {
		return CoeffMat.MulVec(translate(v))
	}

	CoeffMatInv, err := G.MatFromInputOutput(mat_target, mat_src)
	if err != nil {
		log.Fatal(err)
	}

	fromCanonical := func(v G.Vec) G.Vec {
		return translateInv(CoeffMatInv.MulVec(v))
	}

	return toCanonical, fromCanonical
}

func canonicalRotation(angles, rotCenter G.Vec) func(v G.Vec) G.Vec {
	// Rotation around the X-axis
	rotationX := G.Mat{
		G.Vec{1, 0, 0},
		G.Vec{0, math.Cos(angles[0]), -math.Sin(angles[0])},
		G.Vec{0, math.Sin(angles[0]), math.Cos(angles[0])},
	}

	// Rotation around the Y-axis
	rotationY := G.Mat{
		G.Vec{math.Cos(angles[1]), 0, math.Sin(angles[1])},
		G.Vec{0, 1, 0},
		G.Vec{-math.Sin(angles[1]), 0, math.Cos(angles[1])},
	}

	// Rotation around the Z-axis
	rotationZ := G.Mat{
		G.Vec{math.Cos(angles[2]), -math.Sin(angles[2]), 0},
		G.Vec{math.Sin(angles[2]), math.Cos(angles[2]), 0},
		G.Vec{0, 0, 1},
	}

	// Combine the rotation matrices
	rotationMatrix := rotationZ.MulMat(rotationY).MulMat(rotationX)

	return func(p G.Vec) G.Vec {
		relative := p.Sub(rotCenter)
		rotated := rotationMatrix.MulVec(relative)
		return rotated.Add(rotCenter)
	}
}
