package discord

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"net/url"
	"strings"
)

type AccessTokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    uint   `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
}

func (c *Client) GetAccessToken(code string) AccessTokenResponse {
	values := url.Values{}
	values.Add("client_id", c.ClientID)
	values.Add("client_secret", c.ClientSecret)
	values.Add("grant_type", "authorization_code")
	values.Add("code", code)
	values.Add("redirect_uri", c.RedirectURI)
	req, err := http.NewRequest("POST",
		"https://discord.com/api/v10/oauth2/token",
		strings.NewReader(values.Encode()),
	)
	if err != nil {
		log.Panicf("creating access token request failed: %s", err)
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		log.Panicf("requesting access token failed: %s", err)
	}
	bs, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Panicf("reading response bytes failed: %s", err)
	}
	if resp.StatusCode != 200 {
		log.Panicf("requesting access token failed: %s", string(bs))
	}
	var response AccessTokenResponse
	err = json.Unmarshal(bs, &response)
	if err != nil {
		log.Panicf("decoding access token response failed: %s", err)
	}
	return response
}
