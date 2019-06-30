package config

type GameConfig_t struct {
	Game             string   `toml:"Game"`
	EngineBinaryName string   `toml:"EngineBinaryName"`
	GameDirectory    string   `toml:"GameDirectory"`
	StartingMap      string   `toml:"StartingMap"`
	LaunchOptions    []string `toml:"LaunchOptions"`
}

type Config_t struct {
	Game GameConfig_t
}
