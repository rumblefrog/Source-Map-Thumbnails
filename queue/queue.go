package queue

import (
	"io/ioutil"
	"path/filepath"
	"time"

	"github.com/RumbleFrog/Source-Map-Thumbnails/postprocessor"
	"github.com/RumbleFrog/Source-Map-Thumbnails/preprocessor"
	"github.com/RumbleFrog/Source-Map-Thumbnails/rcon"
	"github.com/RumbleFrog/Source-Map-Thumbnails/utils"
	"github.com/sirupsen/logrus"

	"github.com/RumbleFrog/Source-Map-Thumbnails/config"
	"github.com/RumbleFrog/Source-Map-Thumbnails/spawner"
)

type Queue_t struct {
	Position      int64
	Maps          []string
	PreProcessor  *preprocessor.PreProcessor_t
	PostProcessor *postprocessor.PostProcessor_t
	Wait          chan int8
	Connection    *rcon.RemoteConsole
}

func NewQueue() (q *Queue_t) {
	q = &Queue_t{
		Position:      0,
		Maps:          nil, // We will initialize this once we read the directory
		PreProcessor:  preprocessor.NewPreProcessor(),
		PostProcessor: postprocessor.NewPostProcessor(),
		Wait:          make(chan int8, 1),
	}

	// Should we be registering the handlers here? Move to main and register base on config
	q.PreProcessor.AddHandler(preprocessor.AlreadyProcessed_t{})

	return
}

func (q *Queue_t) Start() {
	q.Populate()

	logrus.Infof("Populated %d maps", len(q.Maps))

	time.AfterFunc(time.Minute, q.AttemptConnect)

	<-q.Wait

	q.ProcessItem()

	// Call queue processing
}

func (q *Queue_t) ProcessItem() {
	// Match status map to see if we need to change map
	q.ChangeLevel()

	<-q.Wait

}

func (q *Queue_t) ChangeLevel() {
	q.Connection.Write("changelevel " + q.Maps[q.Position])

	time.AfterFunc(10*time.Second, q.CheckMap)
}

func (q *Queue_t) CheckMap() {
	_, err := q.Connection.Write("status")

	if err != nil {
		time.AfterFunc(10*time.Second, q.CheckMap)

		return
	}
}

func (q *Queue_t) AttemptConnect() {
	var err error

	q.Connection, err = rcon.Dial(utils.GetFirstLocalIPv4()+":27015", "smt")

	if err != nil || q.Connection == nil {
		time.AfterFunc(10*time.Second, q.AttemptConnect)

		logrus.Debug("RCON connection failed. Retrying in 10s")

		return
	}

	logrus.Info("RCON connection established")

	q.Wait <- 1
}

// Calling this will also stop the block at .Wait, causing it to send an int to main to finish cleaning up
func (q *Queue_t) Terminate() error {
	if q.Connection != nil {
		q.Connection.Close()
	}

	return spawner.Command.Process.Kill()
}

func (q *Queue_t) Populate() {
	mapDir := filepath.Join(
		config.Config.Game.GameDirectory,
		config.Config.Game.Game,
		"maps",
	)

	files, err := ioutil.ReadDir(mapDir)

	q.Maps = make([]string, 0, len(files)) // Let's pass a capacity here to prevent slice reallocation (slightly bigger is fine)

	if err != nil {
		q.Terminate()
		return
	}

	for _, file := range files {
		if !file.IsDir() && q.PreProcessor.Run(file.Name()) {
			q.Maps = append(q.Maps, file.Name())
		}
	}
}
