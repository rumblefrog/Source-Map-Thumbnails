package queue

import (
	"io/ioutil"
	"path/filepath"

	"github.com/RumbleFrog/Source-Map-Thumbnails/postprocessor"
	"github.com/RumbleFrog/Source-Map-Thumbnails/preprocessor"
	"github.com/RumbleFrog/Source-Map-Thumbnails/rcon"

	"github.com/RumbleFrog/Source-Map-Thumbnails/config"
	"github.com/RumbleFrog/Source-Map-Thumbnails/spawner"
)

type Queue_t struct {
	Position      int64
	Maps          []string
	PreProcessor  *preprocessor.PreProcessor_t
	PostProcessor *postprocessor.PostProcessor_t
}

func NewQueue() (q *Queue_t) {
	q = &Queue_t{
		Position:      0,
		Maps:          nil, // We will initialize this once we read the directory
		PreProcessor:  preprocessor.NewPreProcessor(),
		PostProcessor: postprocessor.NewPostProcessor(),
	}

	// Should we be registering the handlers here? Move to main and register base on config
	q.PreProcessor.AddHandler(preprocessor.AlreadyProcessed_t{})

	return
}

func (q *Queue_t) Start() {
	q.Populate()

	// Call queue processing
}

func (q *Queue_t) ProcessItem() {
	// Match status map to see if we need to change map
	reqID, err := q.ChangeLevel()

	if err != nil {
		q.ProcessItem()

		return
	}
}

func (q *Queue_t) ChangeLevel() (int, error) {
	return rcon.Connection.Write("changelevel " + q.Maps[q.Position])
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
		spawner.Terminate()
		return
	}

	for _, file := range files {
		if !file.IsDir() && q.PreProcessor.Run(file.Name()) {
			q.Maps = append(q.Maps, file.Name())
		}
	}
}
