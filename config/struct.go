package config

type GameConfig_t struct {
	Game               string   `toml:"Game"`
	GameBinaryLocation string   `toml:"GameBinaryLocation"`
	GameDirectory      string   `toml:"GameDirectory"`
	LaunchOptions      []string `toml:"LaunchOptions"`
}

type Config_t struct {
	Game GameConfig_t
}
