package postprocessor

type PostProcessorHandler_t = func(Map_t)

type PostProcessor_t struct {
	handlers []PostProcessorHandler_t
}

func NewPostProcessor() *PostProcessor_t {
	return &PostProcessor_t{
		handlers: make([]PostProcessorHandler_t, 0),
	}
}

func (p *PostProcessor_t) AddHandler(h PostProcessorHandler_t) PostProcessorHandler_t {
	p.handlers = append(p.handlers, h)

	return h
}

func (p *PostProcessor_t) Run(m Map_t) {
	for _, fn := range p.handlers {
		fn(m)
	}
}
