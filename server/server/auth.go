package server

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"susie.mx/gokemon/models"
)

func (s *Server) DiscordLogin(c *gin.Context) {
	authCode := c.Request.URL.Query().Get("code")
	accessToken := s.DiscordClient.GetAccessToken(authCode).AccessToken
	discordUser := s.DiscordClient.GetUser("@me", accessToken)
	username := discordUser.Username
	var user models.User
	s.DB.Preload("OwnedPokemon").Preload("Friends").First(&user, "discord_id = ?", discordUser.ID)
	if user.ID == 0 {
		s.DB.Create(&models.User{
			DiscordID:         discordUser.ID,
			Username:          username,
			ProfilePictureURL: fmt.Sprintf("https://cdn.discordapp.com/avatars/%s/%s.png", discordUser.ID, discordUser.Avatar),
			Friends:           []*models.User{},
			OwnedPokemon:      []models.Pokemon{},
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
	c.Redirect(http.StatusFound, fmt.Sprintf("http://localhost:3000/%s", username))
}

func (s *Server) Logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Delete("accessToken")
	session.Delete("username")
	session.Save()
	c.Redirect(http.StatusFound, "http://localhost:3000")
}
