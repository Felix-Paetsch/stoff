package geometry

func SolveLGS(A, B Mat) (Mat, error) {
	A_inv, err := A.Inverse()
	if err != nil {
		return Mat{}, err
	}

	C := B.MulMat(A_inv)
	return C, nil
}

func LinePlaneIntersection(P1, P2, Q1, Q2, Q3 Vec) (Vec, bool) {
	// Direction Vector of the line
	lineDir := P2.Sub(P1)

	// Normal Vector of the plane
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
