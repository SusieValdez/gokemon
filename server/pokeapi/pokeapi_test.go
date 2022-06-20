package pokeapi_test

import (
	"fmt"
	"testing"

	"susie.mx/gokemon/pokeapi"
)

func TestPokemonSpecies(t *testing.T) {
	p, err := pokeapi.GetPokemonSpecies("deoxys")
	if err != nil {
		t.Fatalf("failed to get pokemon species: %s", err)
	}
	fmt.Printf("%#v", p)
}

func TestPokemon(t *testing.T) {
	p, err := pokeapi.GetPokemon("unown")
	if err != nil {
		t.Fatalf("failed to get pokemon: %s", err)
	}
	fmt.Printf("%#v", p)
}

func TestPokemonForm(t *testing.T) {
	p, err := pokeapi.GetPokemonForm("bulbasaur")
	if err != nil {
		t.Fatalf("failed to get pokemon form: %s", err)
	}
	fmt.Printf("%#v", p)
}
