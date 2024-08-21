package render

import (
	"fmt"
	"image"
	"log"
	"math"
	"sort"
	G "stoffgo/geometry"

	"github.com/fogleman/gg"
	"golang.org/x/mobile/event/key"
)

type Scene struct {
	Camera *Camera
	Points *[]G.Vec
	Lines  *[][2]int
}

func (s *Scene) Point(p G.Vec) {
	*s.Points = append(*s.Points, p)
}

func (s *Scene) LineFromInt(p1Index, p2Index int) {
	*s.Lines = append(*s.Lines, [2]int{p1Index, p2Index})
}

func (s *Scene) findPointIndex(p G.Vec) (int, bool) {
	for i, point := range *s.Points {
		if point == p {
			return i, true
		}
	}
	return -1, false
}

func (s *Scene) Line(p1, p2 G.Vec) {
	idx1, found1 := s.findPointIndex(p1)
	if !found1 {
		log.Fatalf("Critical error: Point %v not found and cannot be added.", p1)
	}

	idx2, found2 := s.findPointIndex(p2)
	if !found2 {
		log.Fatalf("Critical error: Point %v not found and cannot be added.", p2)
	}

	*s.Lines = append(*s.Lines, [2]int{idx1, idx2})
}

func (s *Scene) SetCamera(cam *Camera) *Scene {
	s.Camera = cam
	return s
}

func DefaultScene() *Scene {
	points := make([]G.Vec, 0)
	lines := make([][2]int, 0)
	return &Scene{
		Camera: nil,
		Points: &points,
		Lines:  &lines,
	}
}

func (s *Scene) Render(img *image.RGBA, w, h int) {
	dc := gg.NewContextForRGBA(img)

	dc.SetRGB(0, 0, 0)
	dc.Clear()

	normalize := NormalizeVec(s.Camera.screen)
	normCamera := s.Camera.Normalize()

	var lineThroughScreenIndicators []G.Vec

	for _, line := range *s.Lines {
		p1 := (*s.Points)[line[0]]
		p2 := (*s.Points)[line[1]]

		norm0 := normalize(p1)
		norm1 := normalize(p2)
		projectedPt1, projectionPos1 := normCamera.Project(norm0)
		projectedPt2, projectionPos2 := normCamera.Project(norm1)

		if projectionPos1 != InsideFront && projectionPos2 != InsideFront {
			continue
		}

		if projectionPos2 == InsideFront && projectionPos1 != InsideFront {
			t := projectedPt1
			projectedPt1 = projectedPt2
			projectedPt2 = t

			projectionPos2 = projectionPos1
		}

		if projectionPos2 == OutsideBehind || projectionPos2 == InsideBehind {
			intersection, _ := G.LinePlaneIntersection(norm0, norm1, normCamera.screen.BL, normCamera.screen.TL, normCamera.screen.BR)
			projectedPt2 = intersection
			lineThroughScreenIndicators = append(lineThroughScreenIndicators, intersection)
		}

		imgW1 := float64(projectedPt1[0]+1) * float64(w) / 2
		imgH1 := (projectedPt1[1] + float64(w)/float64(h)) * float64(h) / 2
		imgW2 := float64(projectedPt2[0]+1) * float64(w) / 2
		imgH2 := (projectedPt2[1] + float64(w)/float64(h)) * float64(h) / 2

		dc.SetRGB(1, 1, 1)
		dc.DrawLine(imgW1, imgH1, imgW2, imgH2)
		dc.Stroke()
	}

	type pointData struct {
		normalizedPoint G.Vec
		distance        float64
	}

	var pointsData []pointData
	for _, pt := range *s.Points {
		normalizedPt := normalize(pt)

		var distance float64
		if !s.Camera.orth {
			distance = (normalizedPt.Sub(normCamera.focus).Length() - normCamera.focus.Length())
		} else {
			distance = math.Abs(normalizedPt[2])
		}

		pointsData = append(pointsData, pointData{
			normalizedPoint: normalizedPt,
			distance:        distance,
		})
	}

	sort.Slice(pointsData, func(i, j int) bool {
		return pointsData[i].distance > pointsData[j].distance
	})

	for _, pd := range pointsData {
		projectedPt, projectionPos := normCamera.Project(pd.normalizedPoint)

		if projectionPos == InsideFront {
			imgW := float64(projectedPt[0]+1) * float64(w) / 2
			imgH := (projectedPt[1] + float64(w)/float64(h)) * float64(h) / 2

			normalizedDistance := 1.0 / math.Pow((pd.distance+1.0), .3)
			if math.IsNaN(normalizedDistance) {
				normalizedDistance = .01
			}

			red := normalizedDistance
			blue := 1.0 - normalizedDistance
			green := 0.0

			dc.SetRGB(red, green, blue)

			size := 2 + (10-2)*normalizedDistance

			dc.DrawCircle(imgW, imgH, size)
			dc.Fill()
		}
	}

	dc.SetRGB(0.3, 0.3, 0.3)
	for _, indicator := range lineThroughScreenIndicators {
		imgW := float64(indicator[0]+1) * float64(w) / 2
		imgH := (indicator[1] + float64(w)/float64(h)) * float64(h) / 2

		dc.DrawCircle(imgW, imgH, 4)
		dc.Fill()
	}

	midpoint := s.Camera.screen.TL.Add(s.Camera.screen.BR).Scale(0.5)
	rotationAngles := s.Camera.screen.TL.Sub(s.Camera.screen.TR)
	angleX := (int(math.Atan2(rotationAngles[1], rotationAngles[0])*(180/math.Pi)+360) % 360) - 180
	angleY := (int(math.Atan2(rotationAngles[2], rotationAngles[0])*(180/math.Pi)+360) % 360) - 180

	textPadding := 10.0
	textHeight := 20.0

	dc.SetRGB(1, 1, 1)
	dc.DrawStringAnchored(fmt.Sprintf("Midpoint: %v", midpoint), textPadding, float64(h)-textPadding-textHeight-20, 0, 1)
	dc.DrawStringAnchored(fmt.Sprintf("Focus: %v", s.Camera.focus), textPadding, float64(h)-textPadding-20, 0, 1)
	dc.DrawStringAnchored(fmt.Sprintf("Angle X: %d°, Angle Y: %d°", angleX, angleY), textPadding, float64(h)-textPadding-2*textHeight-20, 0, 1)
	dc.DrawStringAnchored(fmt.Sprintf("Orth: %t", s.Camera.orth), textPadding, float64(h)-textPadding-3*textHeight-20, 0, 1)

	dc.Fill()
}

func (s *Scene) Update(delta_time float64, keys map[key.Code]bool) {
	hasKeyPressed := false
	for _, pressed := range keys {
		if pressed {
			hasKeyPressed = true
			break
		}
	}

	if hasKeyPressed {
		s.Camera = s.Camera.ReactToKeypresses(keys, delta_time)
	}
}
