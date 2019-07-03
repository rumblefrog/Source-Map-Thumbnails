# Source Map Thumbnails
An utility application to automate the creation of thumbnails within Source games

## How it works

It starts by scanning your game's map directory for a list of available maps, then it feeds that into `Preprocessors` that determines whether to add that map to queue for processing. 

Examples of preprocessors would be checking if map is already processed, if map name starts with X, size of map file, etc.

It then starts the game and start the processing cycle for each map, after each map is processed, it then proceeds to call to `Postprocessors` that can be used to determine what to do with the processed data.

Examples of postprocessors would be storing the data to database, generating meta files, data aggregation, moving screenshots to directory, etc.

## Installation

1. Download and install the latest **1.11** Metamod from [Metamod](http://www.sourcemm.net) to your game folder
2. Download and install the [latest release](https://github.com/rumblefrog/Source-Map-Thumbnails/releases) of Source Map Thumbnail for your system

    1. Extract contents of `server` to your game folder
    2. Create a folder where you want destination screenshot to be and extract `config.toml` and `Source-Map-Thumbnails` binary
    3. Configure config.toml to your environment

3. Populate the game maps folder with the maps you wish to process
4. Execute the `Source-Map-Thumbnails` binary

## Pre/Post Processors

For experienced users, you may want to create your own pre/post processors that furthers extends the functionalities within `preprocessor` and/or `postprocessor` directory.

Note that pre and post processors are chainable, and its order is the order the handle was registered

### Example Pseudo PreProcessor

```go
package preprocessor

type NameCheck_t struct {}

func (n NameCheck_t) Initiate() bool {
    // Perform any initiation operations (obtaining file handle, etc)

    // Return true if successful, false otherwise
}

func (n NameCheck_t) Handle(m string) bool {
    if m == "some_desired_map_name" {
        return true // Let it be added to queue
    }

    return false // Don't add to queue
}
```

### Example Pseudo PostProcessor

```go
package postprocessor

import (
    "github.com/rumblefrog/Source-Map-Thumbnails/meta"
)

type DatabaseInsertion_t struct {
    Database *SomeDatabaseConnectionPTR
}

func (db *DatabaseInsertion_t) Initiate() bool {
    // Perform connections, schema setup, etc

    // Return true if successful, false otherwise
    return true
}

// Note that it has a void return type
func (db *DatabaseInsertion_t) Handle(m meta.Map_t) {
    // Insert data into database
}
```

For more examples, view `preprocessor` and `postprocessor` directories respectively.

## Building It Yourself

### Building The Extension
1. Clone and install the latest AMBuild
2. Clone the latest Metamod Source
3. Clone the latest hl2sdk
4. Navigate to extension and create a build directory and navigate to it
5. Run `../configure.py` with necessary path options from the build directory
6. Run `ambuild` within the build directory

### Building The Main Program
1. Download and install Golang
2. Clone latest master
3. Run `go build` within the source directory

## License

GNU General Public License v3.0
