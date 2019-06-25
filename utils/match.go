package utils

import (
	"regexp"
)

var (
	MapRegex    = regexp.MustCompile("map\\s+:\\s([A-z0-9]+)")
	CStateRegex = regexp.MustCompile("#.* +([0-9]+) +\"(.+)\" +(STEAM_[0-9]:[0-9]:[0-9]+|\\[U:[0-9]:[0-9]+\\]) +([0-9:]+) +([0-9]+) +([0-9]+) +([a-zA-Z]+).* +([A-z0-9.:]+)")
)
