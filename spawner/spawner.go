package spawner

import (
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"

	"github.com/sirupsen/logrus"

	"github.com/RumbleFrog/Source-Map-Thumbnails/config"
	"github.com/RumbleFrog/Source-Map-Thumbnails/rcon"
)

var (
	Command *exec.Cmd
)

// Function should be spawned in a separate goroutine, chan will notify if exited
func SpawnGame(terminate chan<- int8) {
	SpawnArgs := []string{
		"-game " + config.Config.Game.Game,
		"-windowed",
		"-novid",
		"-usercon",
		"-ip 127.0.0.1", // Bind to a local interface so only we can connect
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
		logrus.Error(err)

		terminate <- 0
	}

	Command.Wait()

	terminate <- 0
}

// Calling this will also stop the block at .Wait, causing it to send an int to main to finish cleaning up
func Terminate() error {
	rcon.Connection.Close()

	return Command.Process.Kill()
}
