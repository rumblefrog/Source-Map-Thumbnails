package postprocessor

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/rumblefrog/Source-Map-Thumbnails/config"
	"github.com/rumblefrog/Source-Map-Thumbnails/meta"
	"github.com/rumblefrog/Source-Map-Thumbnails/utils"
	"github.com/sirupsen/logrus"
)

type Organize_t struct {
}

func (o Organize_t) Initiate() bool {
	if config.Config.PostProcessing.Organize == false {
		return false
	}

	err := utils.CreateDirIfNotExist("screenshots", os.ModePerm)

	return err == nil
}

func (o Organize_t) Handle(m meta.Map_t) {
	nPath := "screenshots/" + m.Name

	err := utils.CreateDirIfNotExist(nPath, os.ModePerm)

	if err != nil {
		return
	}

	gamePath := utils.GamePathJoin("screenshots")

	files, err := ioutil.ReadDir(gamePath)

	if err != nil {
		return
	}

	i := 0

	for _, file := range files {
		if file.IsDir() {
			continue
		}

		if !strings.HasPrefix(file.Name(), m.Name) {
			continue
		}

		abs, _ := filepath.Abs(fmt.Sprintf("%s/%d%s", nPath, i, filepath.Ext(file.Name())))

		err = os.Rename(
			filepath.Clean(gamePath+"/"+file.Name()),
			abs,
		)

		if err != nil {
			logrus.Error(err)

			return
		}

		i++
	}

	bytes, err := json.MarshalIndent(m, "", "    ")

	if err != nil {
		return
	}

	ioutil.WriteFile(nPath+"/meta.json", bytes, 0644)
}
