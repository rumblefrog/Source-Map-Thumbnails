package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/mattn/go-colorable"

	"github.com/RumbleFrog/Source-Map-Thumbnails/config"
	"github.com/RumbleFrog/Source-Map-Thumbnails/queue"
	"github.com/RumbleFrog/Source-Map-Thumbnails/spawner"
	"github.com/sirupsen/logrus"
)

func init() {
	logrus.SetLevel(logrus.DebugLevel)
	logrus.SetFormatter(&logrus.TextFormatter{ForceColors: true})
	logrus.SetOutput(colorable.NewColorableStdout())
}

func main() {
	config.ParseConfig()

	terminate := make(chan int8, 1)

	logrus.Info("Launching game")

	go spawner.SpawnGame(terminate)

	queue := queue.NewQueue()

	go ListenExit(queue)

	go queue.Start()

	<-terminate

	logrus.Info("Process and game terminated")

	// Perform cleanup
}

func ListenExit(queue *queue.Queue_t) {
	sc := make(chan os.Signal, 1)

	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)

	<-sc

	queue.Terminate()
}
