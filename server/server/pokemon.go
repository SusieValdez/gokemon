package server

import (
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"susie.mx/gokemon/models"
)

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

func (s *Server) NewPokemonLoop() {
	ticker := time.NewTicker(20 * time.Minute)
	for {
		var users []models.User
		s.DB.Find(&users)
		for _, user := range users {
			randomPokemon := s.GetRandomPokemon()
			// TODO: Check if could replace with s.DB.Model(&user).Association("OwnedPokemon").Append(randomPokemon) ?
			user.OwnedPokemon = append(user.OwnedPokemon, randomPokemon)
			s.DB.Save(&user)
		}
		<-ticker.C
	}
}
