package preprocessor

import "strings"

type TFDBMapPrefix_t struct {
}

func (mp TFDBMapPrefix_t) Initiate() bool {
	return true
}

func (mp TFDBMapPrefix_t) Handle(m string) bool {
	return strings.HasPrefix(m, "tfdb")
}
