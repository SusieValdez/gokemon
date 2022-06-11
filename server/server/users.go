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

type PostFriendshipRequest struct {
	FriendRequestID uint `json:"friendRequestId"`
}

func (s *Server) PostFriendship(c *gin.Context) {
	var postFriendshipRequest PostFriendshipRequest
	c.BindJSON(&postFriendshipRequest)

	var friendRequest models.FriendRequest
	s.DB.Preload("User").Preload("Friend").First(&friendRequest, postFriendshipRequest.FriendRequestID)
	user := friendRequest.User
	friend := friendRequest.Friend

	s.DB.Model(&user).Association("Friends").Append(&friend)
	s.DB.Model(&friend).Association("Friends").Append(&user)
	c.JSON(http.StatusOK, "ok")
}

type DeleteFriendshipRequest struct {
	FriendID uint `json:"friendId"`
}

func (s *Server) DeleteFriendship(c *gin.Context) {
	var deleteFriendshipRequest DeleteFriendshipRequest
	c.BindJSON(&deleteFriendshipRequest)

	var friend models.User
	s.DB.Preload("Friends").First(&friend, deleteFriendshipRequest.FriendID)

	session := sessions.Default(c)
	loggedInUsername := session.Get("username")
	var user models.User
	s.DB.Preload("OwnedPokemon").Preload("Friends").First(&user, "username = ?", loggedInUsername)

	s.DB.Model(&user).Association("Friends").Delete(&friend)
	s.DB.Model(&friend).Association("Friends").Delete(&user)
	c.JSON(http.StatusOK, "ok")
}