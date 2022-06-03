package main

import (
	"fmt"
	"log"
	"net/http"

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
	id := c.Param("id")
	var pokemon models.Pokemon
	s.db.First(&pokemon, id)
	c.SecureJSON(http.StatusOK, pokemon)
}

func (s *Server) userHandler(c *gin.Context) {
	username := c.Param("username")
	var user models.User
	s.db.Preload("OwnedPokemon").Preload("Friends").First(&user, "username = ?", username)
	c.SecureJSON(http.StatusOK, user)
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
	r.GET("/api/v1/pokemon/:id", s.pokemonHandler)
	r.GET("/api/v1/user/:username", s.userHandler)
	r.Run(":8080")
}
