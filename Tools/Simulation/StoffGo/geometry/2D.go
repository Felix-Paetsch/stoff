package geometry

import (
	"fmt"
	"math"
)

type Vec2 [2]float64
type Mat2 [2]Vec2

func (v Vec2) Add(vec Vec2) Vec2 {
	return Vec2{v[0] + vec[0], v[1] + vec[1]}
}

func (v Vec2) Sub(vec Vec2) Vec2 {
	return v.Add(vec.Scale(-1))
}

func (v Vec2) Dot(vec Vec2) float64 {
	return v[0]*vec[0] + v[1]*vec[1]
}

func (v Vec2) Scale(a float64) Vec2 {
	return Vec2{v[0] * a, v[1] * a}
}

func (v Vec2) Normalize() Vec2 {
	return v.Scale(1 / v.Length())
}

func (v Vec2) ToLen(a float64) Vec2 {
	return v.Normalize().Scale(a)
}

func (v Vec2) Length() float64 {
	return math.Sqrt(v[0]*v[0] + v[1]*v[1])
}

func (v Vec2) Distance(vec Vec2) float64 {
	return math.Sqrt(math.Pow(v[0]-vec[0], 2) + math.Pow(v[1]-vec[1], 2))
}

func Interpolate2D(u, v Vec, t float64) Vec {
	return u.Scale(1 - t).Add(v.Scale(t))
}

func (v Vec2) GetOrthogonal() Vec2 {
	return Vec2{v[1], -v[0]}
}

func (v Vec2) GetOrthonormal() Vec2 {
	return v.GetOrthogonal().Normalize()
}

func (v Vec2) Rotate(angle float64) Vec2 {
	rotMatrix := Mat2{
		Vec2{math.Cos(angle), math.Sin(angle)},
		Vec2{-math.Sin(angle), math.Cos(angle)},
	}
	return rotMatrix.Mult(v).(Vec2)
}

func (v Vec2) String() string {
	return fmt.Sprintf("Vec2{%f, %f}", v[0], v[1])
}

// ================================ Matricies

func (m Mat2) Add(mat Mat2) Mat2 {
	return Mat2{m[0].Add(mat[0]), m[1].Add(mat[1])}
}

func (m Mat2) Sub(mat Mat2) Mat2 {
	return m.Add(mat.Scale(-1))
}

func (m Mat2) Mult(el interface{}) interface{} {
	switch val := el.(type) {
	case Vec2:
		return m.MulVec(val)
	case Mat2:
		return m.MulMat(val)
	case float64:
		return m.Scale(val)
	default:
		panic(fmt.Sprintf("unsupported type for multiplication: %T", el))
	}
}

func (m Mat2) Scale(a float64) Mat2 {
	return Mat2{m[0].Scale(a), m[1].Scale(a)}
}

func (m Mat2) MulVec(v Vec2) Vec2 {
	return Vec2{
		m.Row(0).Dot(v),
		m.Row(1).Dot(v),
	}
}

func (m Mat2) MulMat(n Mat2) Mat2 {
	var res Mat2
	for i := 0; i < 2; i++ {
		for j := 0; j < 2; j++ {
			res[i][j] = m.Row(i).Dot(n[j])
		}
	}
	return res
}

func (m Mat2) Transpose() Mat2 {
	return Mat2{
		Vec2{m[0][0], m[1][0]},
		Vec2{m[0][1], m[1][1]},
	}
}

func (m Mat2) Det() float64 {
	return m[0][0]*m[1][1] - m[0][1]*m[1][0]
}

func (m Mat2) Inverse() (Mat2, error) {
	det := m.Det()
	if det == 0 {
		return Mat2{}, fmt.Errorf("matrix is singular and cannot be inverted")
	}
	preScaled := Mat2{
		Vec2{m[1][1], -m[0][1]},
		Vec2{-m[1][0], m[0][0]},
	}
	return preScaled.Scale(1 / det), nil
}

func (m Mat2) Col(i int) Vec2 {
	return m[i]
}

func (m Mat2) Row(i int) Vec2 {
	return Vec2{m[0][i], m[1][i]}
}

func (m Mat2) String() string {
	return fmt.Sprintf("Mat2{%s, %s}", m[0].String(), m[1].String())
}
