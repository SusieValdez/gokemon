package pokeapi

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Pokemon struct {
	ID      int    `json:"id"`
	Name    string `json:"name"`
	Sprites struct {
		FrontDefault string `json:"front_default"`
		FrontShiny   string `json:"front_shiny"`
	} `json:"sprites"`
}

func GetPokemon(id string) (Pokemon, error) {
	url := fmt.Sprintf("https://pokeapi.co/api/v2/pokemon/%s/", id)
	res, err := http.Get(url)
	if err != nil {
		return Pokemon{}, fmt.Errorf("getting pokemon(%s) failed: %w", id, err)
	}
	defer res.Body.Close()
	if res.StatusCode >= 400 {
		return Pokemon{}, ApiError{URL: url, Response: res}
	}
	decoder := json.NewDecoder(res.Body)
	var pokemon Pokemon
	err = decoder.Decode(&pokemon)
	if err != nil {
		return Pokemon{}, fmt.Errorf("decoding json into pokemon(%s) failed: %w", id, err)
	}
	return pokemon, nil
}
