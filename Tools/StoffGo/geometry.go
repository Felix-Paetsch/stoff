package main

import (
	"fmt"
	"math"
)

type Vec [3]float64 // Column
type Mat [3]Vec     // Column, Column, Column

func (v Vec) Add(u Vec) Vec {
	return Vec{v[0] + u[0], v[1] + u[1], v[2] + u[2]}
}

func (v Vec) Sub(u Vec) Vec {
	return Vec{v[0] - u[0], v[1] - u[1], v[2] - u[2]}
}

func (v Vec) Dot(u Vec) float64 {
	return v[0]*u[0] + v[1]*u[1] + v[2]*u[2]
}

func (v Vec) Cross(u Vec) Vec {
	return Vec{
		v[1]*u[2] - v[2]*u[1],
		v[2]*u[0] - v[0]*u[2],
		v[0]*u[1] - v[1]*u[0],
	}
}

func (v Vec) Scale(f float64) Vec {
	return Vec{v[0] * f, v[1] * f, v[2] * f}
}

func (v Vec) Normalize() Vec {
	return v.Scale(1 / v.Length())
}

func (v Vec) Length() float64 {
	return float64(math.Sqrt(float64(v.Dot(v))))
}

func (v Vec) String() string {
	return fmt.Sprintf("Vec{%f, %f, %f}", v[0], v[1], v[2])
}

func (m Mat) Col(i int) Vec {
	return m[0]
}

func (m Mat) Row(i int) Vec {
	return Vec{m[0][i], m[1][i], m[2][i]}
}

func (m Mat) MulMat(n Mat) Mat {
	var res Mat
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			res[i][j] = m.Row(i).Dot(n[j])
		}
	}
	return res
}

func (m Mat) MulVec(v Vec) Vec {
	return Vec{
		m.Row(0).Dot(v),
		m.Row(1).Dot(v),
		m.Row(2).Dot(v),
	}
}

func (m Mat) Det() float64 {
	return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1]) -
		m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0]) +
		m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0])
}

func (m Mat) Inverse() (Mat, error) {
	det := m.Det()
	if det == 0 {
		return Mat{}, fmt.Errorf("matrix is singular and cannot be inverted")
	}

	// Cofactor matrix
	cofactors := Mat{
		Vec{
			m[1][1]*m[2][2] - m[1][2]*m[2][1],
			m[1][2]*m[2][0] - m[1][0]*m[2][2],
			m[1][0]*m[2][1] - m[1][1]*m[2][0],
		},
		Vec{
			m[0][2]*m[2][1] - m[0][1]*m[2][2],
			m[0][0]*m[2][2] - m[0][2]*m[2][0],
			m[0][1]*m[2][0] - m[0][0]*m[2][1],
		},
		Vec{
			m[0][1]*m[1][2] - m[0][2]*m[1][1],
			m[0][2]*m[1][0] - m[0][0]*m[1][2],
			m[0][0]*m[1][1] - m[0][1]*m[1][0],
		},
	}

	// Transpose and divide by determinant
	inv := Mat{}
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			inv[i][j] = cofactors[j][i] / det
		}
	}

	return inv, nil
}

func solveLGS(A, B Mat) (Mat, error) {
	A_inv, err := A.Inverse()
	if err != nil {
		return Mat{}, err
	}

	C := B.MulMat(A_inv)
	return C, nil
}

func LinePlaneIntersection(P1, P2, Q1, Q2, Q3 Vec) (Vec, bool) {
	// Direction vector of the line
	lineDir := P2.Sub(P1)

	// Normal vector of the plane
	planeNormal := Q2.Sub(Q1).Cross(Q3.Sub(Q1))

	// Check if the line is parallel to the plane
	denominator := planeNormal.Dot(lineDir)
	if denominator == 0 {
		// The line is parallel to the plane, no intersection
		return Vec{}, false
	}

	// Calculate t for the line equation
	t := planeNormal.Dot(Q1.Sub(P1)) / denominator

	// Calculate the intersection point
	intersection := P1.Add(lineDir.Scale(t))
	return intersection, true
}
