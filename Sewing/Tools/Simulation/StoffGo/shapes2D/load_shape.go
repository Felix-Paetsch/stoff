package shapes2d

import (
	"stoffgo/config"
)

func LoadShape(file string) *Plane {
	b := LoadShapeIntoBox(file)
	for i := 0; i < config.C.Simulation2D.SimulationSteps; i++ {
		b.SimulationStep()
	}
	b.FilterExpulsedPoints()
	p := b.ToPlane()
	p.Triangulate()
	return p
}
