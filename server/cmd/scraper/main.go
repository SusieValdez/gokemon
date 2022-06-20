package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"susie.mx/gokemon/models"
	"susie.mx/gokemon/pokeapi"
)

const MAX_POKEMON_ID = 898

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("loading .env file failed")
	}

	pgUsername := os.Getenv("POSTGRES_USERNAME")
	pgPassword := os.Getenv("POSTGRES_PASSWORD")

	dsn := fmt.Sprintf("host=localhost user=%s password=%s dbname=gokemon", pgUsername, pgPassword)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %s", err)
	}

	db.Migrator().DropTable(&models.Pokemon{})
	db.Migrator().DropTable(&models.PokemonForm{})
	db.Migrator().DropTable(&models.Sprites{})
	db.Migrator().DropTable(&models.Type{})
	db.AutoMigrate(&models.Pokemon{})
	db.AutoMigrate(&models.PokemonForm{})
	db.AutoMigrate(&models.Sprites{})
	db.AutoMigrate(&models.Type{})

	speciesChans := []chan pokeapi.PokemonSpecies{}

	for id := 1; id <= MAX_POKEMON_ID; id++ {
		speciesChans = append(speciesChans, make(chan pokeapi.PokemonSpecies))
	}

	for id := 1; id <= MAX_POKEMON_ID; id++ {
		go func(id int) {
			fmt.Printf("starting %d\n", id)
			species, err := pokeapi.GetPokemonSpecies(fmt.Sprintf("%d", id))
			if err != nil {
				log.Fatalln(err)
			}
			speciesChans[id-1] <- species
		}(id)
	}

	for id := uint(1); id <= MAX_POKEMON_ID; id++ {
		pokemonSpecies := <-speciesChans[id-1]
		pokemonChans := []chan pokeapi.Pokemon{}

		pokemon := models.Pokemon{
			ID:                   uint(pokemonSpecies.ID),
			HasGenderDifferences: pokemonSpecies.HasGenderDifferences,
			IsLegendary:          pokemonSpecies.IsLegendary,
			IsMythical:           pokemonSpecies.IsMythical,
			Forms:                []models.PokemonForm{},
		}
		for _, name := range pokemonSpecies.Names {
			if name.Language.Name == "en" {
				pokemon.Name = name.Name
			}
		}
		if pokemon.Name == "" {
			log.Fatalf("could not find name for pokemon species(%d)", pokemonSpecies.ID)
		}
		db.Create(&pokemon)

		for _, variety := range pokemonSpecies.Varieties {
			fmt.Printf("starting variation %s\n", variety.Pokemon.Name)
			pokemonChans = append(pokemonChans, make(chan pokeapi.Pokemon))
		}

		for i, variety := range pokemonSpecies.Varieties {
			go func(i int, name string) {
				pokemon, err := pokeapi.GetPokemon(name)
				if err != nil {
					log.Fatalln(err)
				}
				pokemonChans[i] <- pokemon
			}(i, variety.Pokemon.Name)
		}

		for i := range pokemonSpecies.Varieties {
			pokemonVariety := <-pokemonChans[i]
			pokemonFormChans := []chan pokeapi.PokemonForm{}

			for _, form := range pokemonVariety.Forms {
				fmt.Printf("starting form %s\n", form.Name)
				pokemonFormChans = append(pokemonFormChans, make(chan pokeapi.PokemonForm))
			}

			for i, form := range pokemonVariety.Forms {
				go func(i int, name string) {
					form, err := pokeapi.GetPokemonForm(name)
					if err != nil {
						log.Fatalln(err)
					}
					pokemonFormChans[i] <- form
				}(i, form.Name)
			}

			for i := range pokemonVariety.Forms {
				pokemonForm := <-pokemonFormChans[i]
				var types []models.Type
				for _, pokemonType := range pokemonForm.Types {
					types = append(types, models.Type{Name: pokemonType.Type.Name})
				}
				var formName string
				if len(pokemonForm.Names) == 0 {
					formName = pokemon.Name
				} else {
					for _, name := range pokemonForm.Names {
						if name.Language.Name == "en" {
							formName = name.Name
						}
					}
				}
				if formName == "" {
					log.Fatalf("could not find name for pokemon form(%d/%d)", pokemonVariety.ID, pokemonForm.ID)
				}
				form := models.PokemonForm{
					ID:        uint(pokemonForm.ID),
					PokemonID: uint(pokemonSpecies.ID),
					Name:      formName,
					Types:     types,
					Sprites: models.Sprites{
						FrontDefault:     pokemonForm.Sprites.FrontDefault,
						FrontFemale:      pokemonForm.Sprites.FrontFemale,
						FrontShiny:       pokemonForm.Sprites.FrontShiny,
						FrontShinyFemale: pokemonForm.Sprites.FrontShinyFemale,
					},
				}
				db.Create(&form)
			}
		}
		fmt.Printf("finished %d\n", id)
	}
}
