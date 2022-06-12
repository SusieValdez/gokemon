package server

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"susie.mx/gokemon/models"
)

func (s *Server) DiscordLogin(c *gin.Context) {
	authCode := c.Request.URL.Query().Get("code")
	accessToken := s.DiscordClient.GetAccessToken(authCode).AccessToken
	if accessToken == "" {
		log.Fatalf("fetching access token failed")
	}
	discordUser := s.DiscordClient.GetUser("@me", accessToken)
	if discordUser.ID == "" {
		log.Fatalf("fetching discord user failed")
	}
	username := discordUser.Username
	var user models.User
	s.DB.Preload("OwnedPokemon").Preload("Friends").First(&user, "discord_id = ?", discordUser.ID)
	if user.ID == 0 {
		s.DB.Create(&models.User{
			DiscordID:                     discordUser.ID,
			Username:                      username,
			ProfilePictureURL:             fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png", discordUser.ID, discordUser.Avatar),
			Friends:                       []*models.User{},
			OwnedPokemon:                  []models.Pokemon{},
			NextPokemonSelectionTimestamp: time.Now().Unix(),
		})
	} else {
		username = user.Username
	}
	session := sessions.Default(c)
	session.Set("accessToken", accessToken)
	session.Set("username", username)
	err := session.Save()
	if err != nil {
		log.Fatalf("saving access token to session failed: %s", err)
	}
	c.Redirect(http.StatusFound, fmt.Sprintf("%s/%s", s.ClientBaseURL, username))
}

func (s *Server) Logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Delete("accessToken")
	session.Delete("username")
	session.Save()
	c.Redirect(http.StatusFound, s.ClientBaseURL)
}
