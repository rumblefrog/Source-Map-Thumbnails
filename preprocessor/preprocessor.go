package preprocessor

import (
	"reflect"

	"github.com/sirupsen/logrus"
)

type PreProcessorHandler_t interface {
	Initiate() bool
	Handle(string) bool
}

type PreProcessor_t struct {
	handlers []PreProcessorHandler_t
}

func NewPreProcessor() *PreProcessor_t {
	return &PreProcessor_t{
		handlers: make([]PreProcessorHandler_t, 0),
	}
}

func (p *PreProcessor_t) AddHandler(h PreProcessorHandler_t) bool {
	if h.Initiate() == false {
		logrus.WithField("Handler", reflect.TypeOf(h).Name()).Info("PreProcessor not enabled")

		return false
	}

	p.handlers = append(p.handlers, h)

	return true
}

func (p *PreProcessor_t) Run(m string) bool {
	for _, i := range p.handlers {
		if i.Handle(m) == false {
			return false
		}
	}

	return true
}
