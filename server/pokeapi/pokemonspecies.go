package pokeapi

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type PokemonSpecies struct {
	ID    int `json:"id"`
	Names []struct {
		Language struct {
			Name string `json:"name"`
		} `json:"language"`
		Name string `json:"name"`
	} `json:"names"`
	HasGenderDifferences bool `json:"has_gender_differences"`
	IsLegendary          bool `json:"is_legendary"`
	IsMythical           bool `json:"is_mythical"`
	Varieties            []struct {
		Pokemon struct {
			Name string `json:"name"`
			URL  string `json:"url"`
		} `json:"pokemon"`
	} `json:"varieties"`
}

func GetPokemonSpecies(id string) (PokemonSpecies, error) {
	url := fmt.Sprintf("https://pokeapi.co/api/v2/pokemon-species/%s", id)
	res, err := http.Get(url)
	if err != nil {
		return PokemonSpecies{}, fmt.Errorf("getting pokemon species(%s) failed: %w", id, err)
	}
	defer res.Body.Close()
	if res.StatusCode >= 400 {
		return PokemonSpecies{}, ApiError{URL: url, Response: res}
	}
	decoder := json.NewDecoder(res.Body)
	var species PokemonSpecies
	err = decoder.Decode(&species)
	if err != nil {
		return PokemonSpecies{}, fmt.Errorf("decoding json into pokemon species(%s) failed: %w", id, err)
	}
	return species, nil
}
