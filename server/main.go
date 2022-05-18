package main

import (
	"errors"
	"fmt"
	"net/http"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"susie.mx/gokemon/models"
	"susie.mx/gokemon/pokeapi"
)

func pokemonHandler(c *gin.Context) {
	id := c.Param("id")
	pokeapiPokemon, err := pokeapi.GetPokemon(id)
	if err != nil {
		var apiError pokeapi.ApiError
		if errors.As(err, &apiError) {
			c.String(apiError.Response.StatusCode, http.StatusText(apiError.Response.StatusCode))
			return
		}
		c.String(http.StatusInternalServerError, err.Error())
		return
	}
	pokemon := models.Pokemon{
		ID:        pokeapiPokemon.ID,
		Name:      pokeapiPokemon.Name,
		SpriteUrl: pokeapiPokemon.Sprites.FrontDefault,
	}
	c.SecureJSON(http.StatusOK, pokemon)
}

func main() {
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
	r.GET("/api/v1/pokemon/:id", pokemonHandler)
	r.Run(":8080")
}
