package postprocessor

import "github.com/rumblefrog/Source-Map-Thumbnails/meta"

type PostProcessorHandler_t interface {
	Initiate() bool
	Handle(meta.Map_t)
}

type PostProcessor_t struct {
	handlers []PostProcessorHandler_t
}

func NewPostProcessor() *PostProcessor_t {
	return &PostProcessor_t{
		handlers: make([]PostProcessorHandler_t, 0),
	}
}

func (p *PostProcessor_t) AddHandler(h PostProcessorHandler_t) bool {
	if h.Initiate() == false {
		return false
	}

	p.handlers = append(p.handlers, h)

	return true
}

func (p *PostProcessor_t) Run(m meta.Map_t) {
	for _, i := range p.handlers {
		i.Handle(m)
	}
}
