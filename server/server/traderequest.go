package server

import (
	"net/http"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"susie.mx/gokemon/models"
)

func (s *Server) GetTradeRequests(c *gin.Context) {
	session := sessions.Default(c)
	username := session.Get("username")
	if username == nil {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}
	var user models.User
	s.DB.First(&user, "username = ?", username)
	sentTradeRequests := []models.TradeRequest{}
	s.DB.Preload("User").
		Preload("UserPokemon").
		Preload("Friend").
		Preload("FriendPokemon").
		Find(&sentTradeRequests, "user_id = ?", user.ID)
	receivedTradeRequests := []models.TradeRequest{}
	s.DB.Preload("User").
		Preload("UserPokemon").
		Preload("Friend").
		Preload("FriendPokemon").
		Find(&receivedTradeRequests, "friend_id = ?", user.ID)
	c.JSON(http.StatusOK, gin.H{
		"sent":     sentTradeRequests,
		"received": receivedTradeRequests,
	})
}

type PostTradeRequestRequest struct {
	PokemonID       uint `json:"pokemonId"`
	FriendID        uint `json:"friendId"`
	FriendPokemonID uint `json:"friendPokemonId"`
}

func (s *Server) PostTradeRequest(c *gin.Context) {
	session := sessions.Default(c)
	username := session.Get("username")
	// Can not trade if not logged in
	if username == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "must be logged in",
		})
		return
	}
	var user models.User
	s.DB.Preload("Friends").First(&user, "username = ?", username)
	// Can not trade with self
	var tradeRequestRequest PostTradeRequestRequest
	c.BindJSON(&tradeRequestRequest)
	if user.ID == tradeRequestRequest.FriendID {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "can not trade with self",
		})
		return
	}
	// Must be friends to trade
	areFriends := false
	for _, friend := range user.Friends {
		if friend.ID == tradeRequestRequest.FriendID {
			areFriends = true
		}
	}
	if !areFriends {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "must be friends to trade",
		})
		return
	}
	// Can not have multiple trades of same pokemon with same friend
	var TradeRequest models.TradeRequest
	s.DB.First(&TradeRequest, "user_id = ? AND user_pokemon_id = ? AND friend_id = ? AND friend_pokemon_id = ?",
		user.ID,
		tradeRequestRequest.PokemonID,
		tradeRequestRequest.FriendID,
		tradeRequestRequest.FriendPokemonID,
	)
	if TradeRequest.ID != 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "can not have multiple trades of the same pokemon with the same friend",
		})
		return
	}

	var pokemon models.Pokemon
	s.DB.First(&pokemon, tradeRequestRequest.PokemonID)

	var friend models.User
	s.DB.First(&friend, tradeRequestRequest.FriendID)

	var friendPokemon models.Pokemon
	s.DB.First(&friendPokemon, tradeRequestRequest.FriendPokemonID)

	s.DB.Create(&models.TradeRequest{
		User:          user,
		UserPokemon:   pokemon,
		Friend:        friend,
		FriendPokemon: friendPokemon,
	})
	c.JSON(http.StatusOK, "ok")
}

type DeleteTradeRequestRequest struct {
	TradeRequestID uint `json:"tradeRequestID"`
}

func (s *Server) DeleteTradeRequest(c *gin.Context) {
	var tradeRequestRequest DeleteTradeRequestRequest
	c.BindJSON(&tradeRequestRequest)

	session := sessions.Default(c)
	username := session.Get("username")
	if username == nil {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}
	var loggedInUser models.User
	s.DB.First(&loggedInUser, "username = ?", username)

	var tradeRequest models.TradeRequest
	s.DB.First(&tradeRequest, "id = ?", tradeRequestRequest.TradeRequestID)

	if loggedInUser.ID != tradeRequest.UserID && loggedInUser.ID != tradeRequest.FriendID {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}

	s.DB.Delete(&models.TradeRequest{}, tradeRequestRequest.TradeRequestID)
	c.JSON(http.StatusOK, "ok")
}
