package preprocessor

import (
	"io/ioutil"
	"os"

	"github.com/rumblefrog/Source-Map-Thumbnails/config"
)

type AlreadyProcessed_t struct {
	Files []os.FileInfo
}

func (a *AlreadyProcessed_t) Initiate() bool {
	if config.Config.PreProcessing.AlreadyProcessed == false {
		return false
	}

	var err error

	a.Files, err = ioutil.ReadDir("screenshots")

	return err == nil
}

func (a *AlreadyProcessed_t) Handle(m string) bool {
	for _, file := range a.Files {
		if !file.IsDir() {
			continue
		}

		if file.Name() == m {
			return false
		}
	}

	return true
}
