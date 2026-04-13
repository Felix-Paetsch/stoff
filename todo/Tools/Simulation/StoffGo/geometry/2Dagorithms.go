package geometry

import (
	"fmt"
	"math"
)

func DistanceFromLine(linePoints [2]Vec2, vec Vec2) float64 {
	vec1, vec2 := linePoints[0], linePoints[1]
	vec1ToVec := vec.Sub(vec1)
	vec1ToVec2 := vec2.Sub(vec1)

	projection := vec1ToVec.Dot(vec1ToVec2) / vec1ToVec2.Dot(vec1ToVec2)
	closestPoint := Vec2{
		vec1[0] + projection*vec1ToVec2[0],
		vec1[1] + projection*vec1ToVec2[1],
	}

	return vec.Sub(closestPoint).Length()
}

func DistanceFromLineSegment(endpoints [2]Vec2, vec Vec2) float64 {
	return ClosestVecOnLineSegment(endpoints, vec).Distance(vec)
}

func ClosestVecOnLineSegment(endpoints [2]Vec2, vec Vec2) Vec2 {
	vec1, vec2 := endpoints[0], endpoints[1]
	vec1ToVec := vec.Sub(vec1)
	vec1ToVec2 := vec2.Sub(vec1)
	lineSegmentLength := vec1ToVec2.Length()

	projection := vec1ToVec.Dot(vec1ToVec2) / (lineSegmentLength * lineSegmentLength)

	if projection < 0 {
		return vec1
	} else if projection > 1 {
		return vec2
	} else {
		return Vec2{
			vec1[0] + projection*vec1ToVec2[0],
			vec1[1] + projection*vec1ToVec2[1],
		}
	}
}

func MatrixFromInputOutput(fIn, fOut [2]Vec2) Mat2 {
	inpMatrix := Mat2{fIn[0], fIn[1]}
	outMatrix := Mat2{fOut[0], fOut[1]}

	inv, err := inpMatrix.Inverse()
	if err != nil {
		panic(fmt.Sprintf("Matrix singular: %T", err))
	}

	return outMatrix.Mult(inv).(Mat2)
}

func AffineTransformFromInputOutput(fIn, fOut [2]Vec2) func(Vec2) Vec2 {
	AInp1 := fIn[0].Sub(fIn[1])
	AOut1 := fOut[0].Sub(fOut[1])

	AInp2 := AInp1.GetOrthogonal()
	AOut2 := AOut1.GetOrthogonal()

	A := MatrixFromInputOutput([2]Vec2{AInp1, AInp2}, [2]Vec2{AOut1, AOut2})
	b := fOut[0].Sub(A.Mult(fIn[0]).(Vec2))

	return func(vec Vec2) Vec2 {
		return A.Mult(vec).(Vec2).Add(b)
	}
}

func OrthogonalTransformFromInputOutput(v1, v2 Vec2) func(Vec2) Vec2 {
	return AffineTransformFromInputOutput(
		[2]Vec2{{0, 0}, v1},
		[2]Vec2{{0, 0}, v2},
	)
}

func RotationFun(rotationVec Vec2, angle float64) func(Vec2) Vec2 {
	rotMatrix := Mat2{
		Vec2{math.Cos(angle), math.Sin(angle)},
		Vec2{-math.Sin(angle), math.Cos(angle)},
	}
	return func(v Vec2) Vec2 {
		return rotMatrix.Mult(v.Sub(rotationVec)).(Vec2).Add(rotationVec)
	}
}

func VecAngleClockwise(vec1, vec2 Vec2) float64 {
	res := math.Acos(vec1.Dot(vec2) / (vec1.Length() * vec2.Length()))

	if !math.IsNaN(res) {
		return res
	}

	return math.Pi
}

func DegToRad(d float64) float64 {
	return math.Pi * d / 180
}

func RadToDeg(r float64) float64 {
	return 180 * r / math.Pi
}

func IsPointInPolygon(point Vec2, polygon []Vec2) bool {
	intersections := 0
	n := len(polygon)

	for i := 0; i < n; i++ {
		v1 := polygon[i]
		v2 := polygon[(i+1)%n]

		if isRayIntersectingEdge(point, v1, v2) {
			intersections++
		}
	}

	return intersections%2 != 0
}

func IsPointOnPolygon(point Vec2, polygon []Vec2, tolerance float64) bool {
	n := len(polygon)

	for i := 0; i < n; i++ {
		v1 := polygon[i]
		v2 := polygon[(i+1)%n]

		if DistanceFromLineSegment([2]Vec2{v1, v2}, point) < tolerance {
			return true
		}
	}

	return false
}

func isRayIntersectingEdge(point, v1, v2 Vec2) bool {
	if v1[1] > v2[1] {
		v1, v2 = v2, v1
	}

	if point[1] == v1[1] || point[1] == v2[1] {
		point[1] += 1e-9
	}

	if point[1] < v1[1] || point[1] > v2[1] {
		return false
	}

	intersectionX := v1[0] + (point[1]-v1[1])*(v2[0]-v1[0])/(v2[1]-v1[1])
	return point[0] < intersectionX
}
