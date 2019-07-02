# Source Map Thumbnails
An utility application to automate the creation of thumbnails within Source games

## How it works

It starts by scanning your game's map directory for a list of available maps, then it feeds that into `Preprocessors` that determines whether to add that map to queue for processing. 

Examples of preprocessors would be checking if map is already processed, if map name starts with X, size of map file, etc.

It then starts the game and start the processing cycle for each map, after each map is processed, it then proceeds to call to `Postprocessors` that can be used to determine what to do with the processed data.

Examples of postprocessors would be storing the data to database, generating meta files, data aggregation, moving screenshots to directory, etc.

## Prerequisites

Still todo

## Compiling

Still todo

## Installation

Still todo
