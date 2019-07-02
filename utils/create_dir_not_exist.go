package utils

import (
	"os"
)

func CreateDirIfNotExist(dir string, perm os.FileMode) error {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		err = os.Mkdir(dir, perm)

		return err
	}

	return nil
}
