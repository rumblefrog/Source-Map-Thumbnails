package main

import (
	"github.com/RumbleFrog/Source-Map-Thumbnails/config"
	"github.com/RumbleFrog/Source-Map-Thumbnails/preprocessor"
	"github.com/RumbleFrog/Source-Map-Thumbnails/spawner"
	"github.com/sirupsen/logrus"
)

func main() {
	config.ParseConfig()

	terminate := make(chan int8, 1)

	go spawner.SpawnGame(terminate)

	pre := preprocessor.NewPreProcessor()

	pre.AddHandler(preprocessor.AlreadyProcessed_t{})

	<-terminate

	logrus.Error("Process terminated 0w0")

	// Perform cleanup
}
