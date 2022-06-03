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

	db.AutoMigrate(&models.Pokemon{})

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

	for id := 1; id <= MAX_POKEMON_ID; id++ {
		pokeapiPokemon := <-pokeapiChans[id-1]
		db.Create(&models.Pokemon{Name: pokeapiPokemon.Name, SpriteUrl: pokeapiPokemon.Sprites.FrontDefault})
		fmt.Printf("finished %d\n", id)
	}
}
