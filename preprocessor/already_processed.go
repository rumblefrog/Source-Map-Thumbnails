package preprocessor

type AlreadyProcessed_t struct {
}

func (a AlreadyProcessed_t) Initiate() bool {
	// Obtain file handle/ read file content

	return true
}

func (a AlreadyProcessed_t) Handle(m string) bool {
	return true
}
