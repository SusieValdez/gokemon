package pokeapi

import (
	"fmt"
	"net/http"
)

type ApiError struct {
	URL      string
	Response *http.Response
}

func (e ApiError) Error() string {
	return fmt.Sprintf("request to '%s' responded with status code(%d)", e.URL, e.Response.StatusCode)
}
