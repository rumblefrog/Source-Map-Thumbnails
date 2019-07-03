package preprocessor

import (
	"strings"

	"github.com/rumblefrog/Source-Map-Thumbnails/config"
)

type MapPrefix_t struct {
}

func (mp MapPrefix_t) Initiate() bool {
	return config.Config.PreProcessing.PrefixEnabled
}

func (mp MapPrefix_t) Handle(m string) bool {
	return strings.HasPrefix(m, config.Config.PreProcessing.Prefix)
}
