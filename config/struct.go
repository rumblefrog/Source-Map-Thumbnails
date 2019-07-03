package config

type GameConfig_t struct {
	Game             string   `toml:"Game"`
	EngineBinaryName string   `toml:"EngineBinaryName"`
	GameDirectory    string   `toml:"GameDirectory"`
	StartingMap      string   `toml:"StartingMap"`
	LaunchOptions    []string `toml:"LaunchOptions"`
}

type PreProcessing_t struct {
	PrefixEnabled bool   `toml:"PrefixEnabled"`
	Prefix        string `toml:"Prefix"`

	AlreadyProcessed bool `toml:"AlreadyProcessed"`
}

type PostProcessing_t struct {
	Organize bool `toml:"Organize"`
}

type Config_t struct {
	Game           GameConfig_t
	PreProcessing  PreProcessing_t
	PostProcessing PostProcessing_t
}
