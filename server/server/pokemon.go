package server

import (
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"susie.mx/gokemon/models"
)

const NumMinutesBetweenNewPokemon = 25
const NumPendingPokemon = 3
const AverageEncounterRatePerMinuteInGames = 2
const ShinyRateInGames = 1 / 8192.0
const ShinyRate = NumMinutesBetweenNewPokemon * AverageEncounterRatePerMinuteInGames * ShinyRateInGames / NumPendingPokemon
const NewPokemonInterval = NumMinutesBetweenNewPokemon * time.Minute

func (s *Server) GetPokemons(c *gin.Context) {
	var pokemon []models.Pokemon
	s.DB.Preload("Forms").Preload("Forms.Types").Preload("Forms.Sprites").Find(&pokemon)
	c.JSON(http.StatusOK, pokemon)
}

func (s *Server) GetRandomPokemon() models.Pokemon {
	randomID := rand.Intn(models.MaxPokemonId-1) + 1
	var pokemon models.Pokemon
	s.DB.Preload("Forms").First(&pokemon, randomID)
	return pokemon
}

func (s *Server) NewPokemonTimer(userID uint) {
	var user models.User
	s.DB.Preload("PendingPokemon").First(&user, userID)
	nextTime := user.NextPokemonSelectionTimestamp
	now := time.Now().UnixMilli()
	duration := time.Duration(nextTime-now) * time.Millisecond
	<-time.After(duration)
	if len(user.PendingPokemon) > 0 {
		return
	}
	var ownedPokemons []models.OwnedPokemon
	for i := 0; i < NumPendingPokemon; i++ {
		p := s.GetRandomPokemon()
		ownedPokemon := models.OwnedPokemon{
			PendingOwnerID: &user.ID,
			Pokemon:        p,
			FormIndex:      uint(rand.Intn(len(p.Forms))),
			IsShiny:        rand.Float64() <= ShinyRate,
		}
		s.DB.Create(&ownedPokemon)
		ownedPokemons = append(ownedPokemons, ownedPokemon)
	}
	s.DB.Model(&user).Association("PendingPokemon").Append(&ownedPokemons)
}

type SelectPokemonRequest struct {
	PendingPokemonIndex uint `json:"pendingPokemonIndex"`
}

func (s *Server) SelectPokemon(c *gin.Context) {
	session := sessions.Default(c)
	username := session.Get("username")
	var user models.User
	s.DB.Preload("PendingPokemon").First(&user, "username = ?", username)
	var request SelectPokemonRequest
	c.BindJSON(&request)
	selectedPokemon := user.PendingPokemon[request.PendingPokemonIndex]
	for i, p := range user.PendingPokemon {
		s.DB.Model(&user).Association("PendingPokemon").Delete(&p)
		if uint(i) != request.PendingPokemonIndex {
			s.DB.Delete(&p)
		}
	}
	s.DB.Model(&user).Association("OwnedPokemon").Append(&selectedPokemon)
	user.NextPokemonSelectionTimestamp = time.Now().Add(NewPokemonInterval).UnixMilli()
	s.DB.Save(&user)
	go s.NewPokemonTimer(user.ID)
	c.JSON(http.StatusOK, "ok")
}
