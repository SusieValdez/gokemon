package pokeapi

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type PokemonForm struct {
	ID    int `json:"id"`
	Names []struct {
		Language struct {
			Name string `json:"name"`
		} `json:"language"`
		Name string `json:"name"`
	} `json:"names"`
	Types []struct {
		Type struct {
			Name string `json:"name"`
		} `json:"type"`
	} `json:"types"`
	Sprites struct {
		FrontDefault     string `json:"front_default"`
		FrontFemale      string `json:"front_female"`
		FrontShiny       string `json:"front_shiny"`
		FrontShinyFemale string `json:"front_shiny_female"`
	} `json:"sprites"`
}

func GetPokemonForm(id string) (PokemonForm, error) {
	url := fmt.Sprintf("https://pokeapi.co/api/v2/pokemon-form/%s", id)
	res, err := http.Get(url)
	if err != nil {
		return PokemonForm{}, fmt.Errorf("getting pokemon form(%s) failed: %w", id, err)
	}
	defer res.Body.Close()
	if res.StatusCode >= 400 {
		return PokemonForm{}, ApiError{URL: url, Response: res}
	}
	decoder := json.NewDecoder(res.Body)
	var form PokemonForm
	err = decoder.Decode(&form)
	if err != nil {
		return PokemonForm{}, fmt.Errorf("decoding json into pokemon form(%s) failed: %w", id, err)
	}
	return form, nil
}
