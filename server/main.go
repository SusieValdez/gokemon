package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"susie.mx/gokemon/models"
)

type Server struct {
	db *gorm.DB
}

func (s *Server) pokemonHandler(c *gin.Context) {
	var pokemon []models.Pokemon
	s.db.Find(&pokemon)
	c.JSON(http.StatusOK, pokemon)
}

func (s *Server) userHandler(c *gin.Context) {
	username := c.Param("username")
	var user models.User
	s.db.Preload("OwnedPokemon").Preload("Friends").First(&user, "username = ?", username)
	c.JSON(http.StatusOK, user)
}

func (s *Server) getRandomPokemon() models.Pokemon {
	randomID := rand.Intn(models.MaxPokemonId-1) + 1
	var pokemon models.Pokemon
	s.db.First(&pokemon, randomID)
	return pokemon
}

func (s *Server) newPokemonLoop() {
	ticker := time.NewTicker(5000 * time.Millisecond)
	for {
		<-ticker.C
		var users []models.User
		s.db.Find(&users)
		for _, user := range users {
			randomPokemon := s.getRandomPokemon()
			user.OwnedPokemon = append(user.OwnedPokemon, randomPokemon)
			s.db.Save(&user)
		}
	}
}

func main() {
	dsn := "host=localhost user=postgres password=postgres dbname=gokemon"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %s", err)
	}

	db.AutoMigrate(&models.User{})
	db.AutoMigrate(&models.Pokemon{})

	s := &Server{db}
	go s.newPokemonLoop()

	r := gin.New()
	r.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - %s\n",
			param.Method,
			param.Path,
		)
	}))
	r.Use(gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{"http://localhost:3000"},
		AllowMethods: []string{"GET"},
	}))
	r.GET("/api/v1/pokemon", s.pokemonHandler)
	r.GET("/api/v1/user/:username", s.userHandler)
	r.Run(":8080")
}
