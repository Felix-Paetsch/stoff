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

type Simulation struct {
	TriangleSize float64 `json:"triangle_size"`
}

type Config struct {
	WinSize        [2]int         `json:"win_size"`
	CameraMovement CameraMovement `json:"camera_movement"`
	CameraDefaults CameraDefaults `json:"camera_defaults"`
	Simulation     Simulation     `json:"simulation"`
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
