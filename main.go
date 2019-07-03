package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/rumblefrog/Source-Map-Thumbnails/postprocessor"

	"github.com/rumblefrog/Source-Map-Thumbnails/preprocessor"

	"github.com/mattn/go-colorable"

	"github.com/rumblefrog/Source-Map-Thumbnails/config"
	"github.com/rumblefrog/Source-Map-Thumbnails/queue"
	"github.com/rumblefrog/Source-Map-Thumbnails/spawner"
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

	go spawner.SpawnGame(terminate)

	queue := queue.NewQueue()

	queue.PreProcessor.AddHandler(&preprocessor.MapPrefix_t{})
	queue.PreProcessor.AddHandler(&preprocessor.AlreadyProcessed_t{})

	queue.PostProcessor.AddHandler(&postprocessor.Organize_t{})

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
