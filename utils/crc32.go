package utils

import (
	"hash/crc32"
	"io"
	"os"
)

// SSE4.2 added hardware CPU instructions for crc32 CPUID.01H:ECX.SSE42[Bit 20] https://en.wikipedia.org/wiki/SSE4#SSE4.2
func GenerateFileCRC32(path string, poly uint32) (error, uint32) {
	f, err := os.Open(path)

	if err != nil {
		return err, 0
	}

	defer f.Close()

	hash := crc32.New(crc32.MakeTable(poly))

	if _, err := io.Copy(hash, f); err != nil {
		return err, 0
	}

	return nil, hash.Sum32()
}
