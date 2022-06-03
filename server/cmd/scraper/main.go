package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"susie.mx/gokemon/models"
	"susie.mx/gokemon/pokeapi"
)

const MAX_POKEMON_ID = 898

func main() {
	dsn := "host=localhost user=postgres password=postgres dbname=gokemon"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %s", err)
	}
	db.Migrator().DropTable(&models.Pokemon{})
	db.Migrator().DropTable(&models.Type{})
	db.AutoMigrate(&models.Pokemon{})
	db.AutoMigrate(&models.Type{})

	pokeapiChans := []chan pokeapi.Pokemon{}

	for id := 1; id <= MAX_POKEMON_ID; id++ {
		pokeapiChans = append(pokeapiChans, make(chan pokeapi.Pokemon))
	}

	for id := 1; id <= MAX_POKEMON_ID; id++ {
		go func(id int) {
			fmt.Printf("starting %d\n", id)
			pokeapiPokemon, err := pokeapi.GetPokemon(fmt.Sprintf("%d", id))
			if err != nil {
				log.Fatalln(err)
			}
			pokeapiChans[id-1] <- pokeapiPokemon
		}(id)
	}

	for id := uint(1); id <= MAX_POKEMON_ID; id++ {
		pokeapiPokemon := <-pokeapiChans[id-1]
		var types []models.Type
		for _, pokemonType := range pokeapiPokemon.Types {
			types = append(types, models.Type{Name: pokemonType.Type.Name})
		}
		db.Create(&models.Pokemon{
			Name:      pokeapiPokemon.Name,
			SpriteUrl: pokeapiPokemon.Sprites.FrontDefault,
			Types:     types,
		})
		fmt.Printf("finished %d\n", id)
	}
}
