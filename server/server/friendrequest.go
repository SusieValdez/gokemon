package server

import (
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"susie.mx/gokemon/models"
)

func (s *Server) GetFriendRequests(c *gin.Context) {
	session := sessions.Default(c)
	username := session.Get("username")
	if username == nil {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}
	var user models.User
	s.DB.First(&user, "username = ?", username)
	sentFriendRequests := []models.FriendRequest{}
	s.DB.Preload("User").Preload("Friend").Find(&sentFriendRequests, "user_id = ?", user.ID)
	recievedFriendRequests := []models.FriendRequest{}
	s.DB.Preload("User").Preload("Friend").Find(&recievedFriendRequests, "friend_id = ?", user.ID)
	c.JSON(http.StatusOK, gin.H{
		"sent":     sentFriendRequests,
		"recieved": recievedFriendRequests,
	})
}

type PostFriendRequestRequest struct {
	FriendID uint `json:"friendId"`
}

func (s *Server) PostFriendRequest(c *gin.Context) {
	session := sessions.Default(c)
	username := session.Get("username")
	if username == nil {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}
	var user models.User
	s.DB.First(&user, "username = ?", username)

	var friendRequestRequest PostFriendRequestRequest
	c.BindJSON(&friendRequestRequest)
	if user.ID == friendRequestRequest.FriendID {
		c.JSON(http.StatusBadRequest, nil)
		return
	}
	var friendRequest models.FriendRequest
	s.DB.First(&friendRequest, "user_id = ? AND friend_id = ?", user.ID, friendRequestRequest.FriendID)

	if friendRequest.ID != 0 {
		c.JSON(http.StatusBadRequest, nil)
		return
	}
	var friend models.User
	s.DB.First(&friend, friendRequestRequest.FriendID)

	s.DB.Create(&models.FriendRequest{
		User:   user,
		Friend: friend,
	})
	c.JSON(http.StatusOK, "ok")
}

type DeleteFriendRequestRequest struct {
	FriendRequestID uint `json:"friendRequestID"`
}

func (s *Server) DeleteFriendRequest(c *gin.Context) {
	var friendRequestRequest DeleteFriendRequestRequest
	c.BindJSON(&friendRequestRequest)

	session := sessions.Default(c)
	username := session.Get("username")
	if username == nil {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}
	var loggedInUser models.User
	s.DB.First(&loggedInUser, "username = ?", username)

	var friendRequest models.FriendRequest
	s.DB.First(&friendRequest, "id = ?", friendRequestRequest.FriendRequestID)

	if loggedInUser.ID != friendRequest.UserID && loggedInUser.ID != friendRequest.FriendID {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	s.DB.Delete(&models.FriendRequest{}, friendRequestRequest.FriendRequestID)
	c.JSON(http.StatusOK, "ok")
}
