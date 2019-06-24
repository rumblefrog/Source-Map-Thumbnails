package preprocessor

type PreProcessorHandler_t = func(string) bool

type PreProcessor_t struct {
	handlers []PreProcessorHandler_t
}

func NewPreProcessor() *PreProcessor_t {
	return &PreProcessor_t{
		handlers: make([]PreProcessorHandler_t, 0),
	}
}

func (p *PreProcessor_t) AddHandler(h PreProcessorHandler_t) PreProcessorHandler_t {
	p.handlers = append(p.handlers, h)

	return h
}

func (p *PreProcessor_t) Run(m string) bool {
	for _, fn := range p.handlers {
		if fn(m) == false {
			return false
		}
	}

	return true
}
