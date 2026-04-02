package config

import (
	"encoding/json"
	"log"
	"os"
)

type CameraMovement struct {
	MoveSpeed   float64 `json:"move_speed"`
	RotateSpeed float64 `json:"rotate_speed"`
	ZoomSpeed   float64 `json:"zoom_speed"`
	FocusSpeed  float64 `json:"focus_speed"`
}

type CameraDefaults struct {
	Orth     bool       `json:"orth"`
	Width    float64    `json:"width"`
	Midpoint [3]float64 `json:"midpoint"`
	Rotation [3]float64 `json:"rot"`
	Focus    float64    `json:"focus"`
}

type Simulation2D struct {
	AreaPerPoint                   float64 `json:"area_per_pt"`
	SimulationSteps                int     `json:"simulation_steps"`
	GravityExp                     float64 `json:"gravity_exp"`
	PointForceMult                 float64 `json:"point_force_mult"`
	PointForceInfluenceRadius      float64 `json:"point_force_influence_radius"`
	BoundaryForceMult              float64 `json:"boundary_force_mult"`
	BoundaryForceInfluenceDistance float64 `json:"boundary_force_influence_distance"`
	VelocityStepScale              float64 `json:"velocity_step_scale"`
	VelocityMax                    float64 `json:"velocity_max"`
}

type Config struct {
	WinSize        [2]int         `json:"win_size"`
	CameraMovement CameraMovement `json:"camera_movement"`
	CameraDefaults CameraDefaults `json:"camera_defaults"`
	Simulation2D   Simulation2D   `json:"simulation2D"`
}

var C Config

func LoadConfig(file string) {
	data, err := os.ReadFile(file)
	if err != nil {
		log.Fatalf("Error reading config file: %v", err)
	}

	err = json.Unmarshal(data, &C)
	if err != nil {
		log.Fatalf("Error unmarshaling config: %v", err)
	}
}
