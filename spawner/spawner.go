package spawner

import (
	"os/exec"

	"github.com/sirupsen/logrus"

	"github.com/RumbleFrog/Source-Map-Thumbnails/config"
)

// Function should be spawned in a separate goroutine, chan will notify if exited
func SpawnGame(terminate chan<- int8) {
	SpawnArgs := []string{
		"-game " + config.Config.Game.Game,
		"-windowed",
		"-novid",
		"-usercon",
		"+map " + config.Config.Game.StartingMap,
	}

	command := exec.Command(
		config.Config.Game.GameBinaryLocation,
		append(config.Config.Game.LaunchOptions, SpawnArgs...)...,
	)

	err := command.Run()

	if err != nil {
		logrus.Error(err)

		terminate <- 0
	}

	command.Wait()

	terminate <- 0
}
