package server

import (
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"susie.mx/gokemon/models"
)

const NewPokemonInterval = 25 * time.Minute

func (s *Server) GetPokemons(c *gin.Context) {
	var pokemon []models.Pokemon
	s.DB.Preload("Types").Find(&pokemon)
	c.JSON(http.StatusOK, pokemon)
}

func (s *Server) GetRandomPokemon() models.Pokemon {
	randomID := rand.Intn(models.MaxPokemonId-1) + 1
	var pokemon models.Pokemon
	s.DB.First(&pokemon, randomID)
	return pokemon
}

func (s *Server) NewPokemonTimer(userID uint) {
	var user models.User
	s.DB.First(&user, userID)
	nextTime := user.NextPokemonSelectionTimestamp
	now := time.Now().UnixMilli()
	duration := time.Duration(nextTime-now) * time.Millisecond
	<-time.After(duration)
	var existingPendingPokemon models.PendingPokemon
	s.DB.First(&existingPendingPokemon, "user_id = ?", user.ID)
	if existingPendingPokemon.ID != 0 {
		return
	}
	randomPokemon := []models.Pokemon{s.GetRandomPokemon(), s.GetRandomPokemon(), s.GetRandomPokemon()}
	s.DB.Create(&models.PendingPokemon{
		User:    user,
		Pokemon: randomPokemon,
	})
}

func (s *Server) GetPendingPokemons(c *gin.Context) {
	session := sessions.Default(c)
	username := session.Get("username")
	var user models.User
	s.DB.First(&user, "username = ?", username)
	var pendingPokemon models.PendingPokemon
	s.DB.Preload("Pokemon").Find(&pendingPokemon, "user_id = ?", user.ID)
	c.JSON(http.StatusOK, pendingPokemon)
}

type SelectPokemonRequest struct {
	PendingPokemonIndex uint `json:"pendingPokemonIndex"`
}

func (s *Server) SelectPokemon(c *gin.Context) {
	session := sessions.Default(c)
	username := session.Get("username")
	var user models.User
	s.DB.First(&user, "username = ?", username)
	var pendingPokemon models.PendingPokemon
	s.DB.Preload("Pokemon").Find(&pendingPokemon, "user_id = ?", user.ID)
	var request SelectPokemonRequest
	c.BindJSON(&request)
	selectedPokemon := pendingPokemon.Pokemon[request.PendingPokemonIndex]
	s.DB.Model(&user).Association("OwnedPokemon").Append(&selectedPokemon)
	s.DB.Model(&pendingPokemon).Association("Pokemon").Clear()
	s.DB.Delete(&pendingPokemon)
	user.NextPokemonSelectionTimestamp = time.Now().Add(NewPokemonInterval).UnixMilli()
	s.DB.Save(&user)
	go s.NewPokemonTimer(user.ID)
	c.JSON(http.StatusOK, nil)
}
