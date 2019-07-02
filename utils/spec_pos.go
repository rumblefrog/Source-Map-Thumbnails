package utils

import (
	"strconv"
	"strings"

	"github.com/rumblefrog/Source-Map-Thumbnails/meta"
)

func ParseSpecPos(s string) (p meta.Position_t) {
	// Remove trailing \n
	s = strings.TrimSpace(s)

	split := strings.Split(s, " ")

	p.Coordinate[0], _ = strconv.ParseFloat(split[1], 64)
	p.Coordinate[1], _ = strconv.ParseFloat(split[2], 64)
	p.Coordinate[2], _ = strconv.ParseFloat(split[3], 64)

	p.Angle.Pitch, _ = strconv.ParseFloat(split[4], 64)
	p.Angle.Yaw, _ = strconv.ParseFloat(split[5], 64)

	return
}
