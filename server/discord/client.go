package discord

import (
	"net/http"
)

type Client struct {
	HTTPClient   *http.Client
	ClientID     string
	ClientSecret string
	RedirectURI  string
}
