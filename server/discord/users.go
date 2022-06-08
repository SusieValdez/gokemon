package discord

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type User struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Avatar   string `json:"avatar"`
}

func (c *Client) GetUser(userID string, accessToken string) User {
	req, err := http.NewRequest("GET", fmt.Sprintf("https://discord.com/api/v10/users/%s", userID), nil)
	if err != nil {
		log.Fatalf("creating user request failed: %s", err)
	}
	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", accessToken))
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		log.Fatalf("requesting user failed: %s", err)
	}
	var user User
	err = json.NewDecoder(resp.Body).Decode(&user)
	if err != nil {
		log.Fatalf("decoding user response failed: %s", err)
	}
	return user
}
