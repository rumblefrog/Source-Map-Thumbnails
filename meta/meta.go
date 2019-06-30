package meta

type Angle_t struct {
	Pitch float64
	Yaw   float64
}

type Coordinate_t [3]float64

type Position_t struct {
	Coordinate Coordinate_t
	Angle      Angle_t
}

type Map_t struct {
	Name      string
	Count     int
	Positions []Position_t
}

func (a Angle_t) IsEqual(oa Angle_t) bool {
	return (a.Pitch == oa.Pitch &&
		a.Yaw == oa.Yaw)
}

func (c Coordinate_t) IsEqual(oc Coordinate_t) bool {
	return (c[0] == oc[0] &&
		c[1] == oc[1] &&
		c[2] == oc[2])
}

func (p Position_t) IsEqual(op Position_t) bool {
	return p.Coordinate.IsEqual(op.Coordinate) && p.Angle.IsEqual(op.Angle)
}
