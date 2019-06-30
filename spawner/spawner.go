package spawner

import (
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"

	"github.com/RumbleFrog/Source-Map-Thumbnails/utils"

	"github.com/sirupsen/logrus"

	"github.com/RumbleFrog/Source-Map-Thumbnails/config"
)

var (
	Command *exec.Cmd
)

// Function should be spawned in a separate goroutine, chan will notify if exited
func SpawnGame(terminate chan<- int8) {
	SpawnArgs := []string{
		"-steam",
		"-game " + config.Config.Game.Game,
		"-windowed",
		"-noborder",
		"-novid",
		"-usercon",
		"-ip " + utils.GetFirstLocalIPv4(), // Bind to a local interface so only we can connect
		"+map " + config.Config.Game.StartingMap,
		"+rcon_password smt", // A password required for rcon to start
	}

	// We are required to construct the CmdLine (Windows only) ourselves because hl2 cannot unquote the way golang quotes

	var cArg strings.Builder

	cArg.WriteString(filepath.Join(config.Config.Game.GameDirectory, config.Config.Game.EngineBinaryName))
	cArg.WriteRune(' ')

	Command = exec.Command(cArg.String())

	for _, v := range SpawnArgs {
		cArg.WriteRune(' ')
		cArg.WriteString(v)
	}

	for _, v := range config.Config.Game.LaunchOptions {
		cArg.WriteRune(' ')
		cArg.WriteString(v)
	}

	Command.SysProcAttr = &syscall.SysProcAttr{}

	Command.SysProcAttr.CmdLine = cArg.String()

	err := Command.Run()

	if err != nil {
		logrus.Info(err)

		terminate <- 0
	}

	Command.Wait()

	terminate <- 0
}
