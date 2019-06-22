package postprocessor

type Coordinate [3]float64

type Map_t struct {
	Name        string
	Count       int64
	Coordinates []Coordinate
}
