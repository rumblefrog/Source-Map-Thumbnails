package main

import (
	"github.com/RumbleFrog/Source-Map-Thumbnails/config"
	"github.com/RumbleFrog/Source-Map-Thumbnails/spawner"
)

func main() {
	config.ParseConfig()

	terminate := make(chan int8, 1)

	go spawner.SpawnGame(terminate)

	<-terminate

	// Perform cleanup
}
