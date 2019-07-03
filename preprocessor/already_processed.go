package preprocessor

import (
	"io/ioutil"
	"os"
)

type AlreadyProcessed_t struct {
	Files []os.FileInfo
}

func (a *AlreadyProcessed_t) Initiate() bool {
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
