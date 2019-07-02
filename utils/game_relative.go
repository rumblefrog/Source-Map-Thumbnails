package utils

import (
	"path/filepath"

	"github.com/rumblefrog/Source-Map-Thumbnails/config"
)

func GamePathJoin(elem ...string) string {
	return filepath.Join(
		append(
			[]string{
				config.Config.Game.GameDirectory,
				config.Config.Game.Game,
			},
			elem...,
		)...,
	)
}
