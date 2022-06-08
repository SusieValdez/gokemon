package server

import (
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"susie.mx/gokemon/models"
)

func (s *Server) GetUser(c *gin.Context) {
	session := sessions.Default(c)
	loggedInUsername := session.Get("username")
	username := c.Param("username")

	obj := gin.H{
		"loggedInUser": nil,
		"user":         nil,
	}

	var loggedInUser models.User
	if loggedInUsername != "" {
		s.DB.Preload("OwnedPokemon").Preload("Friends").First(&loggedInUser, "username = ?", loggedInUsername)
	}
	if loggedInUser.ID != 0 {
		obj["loggedInUser"] = loggedInUser
	}

	var user models.User
	if username != "" {
		s.DB.Preload("OwnedPokemon").Preload("Friends").First(&user, "username = ?", username)
	}
	if user.ID != 0 {
		obj["user"] = user
	}

	c.JSON(http.StatusOK, obj)
}
