package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

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
	_ = db

	// migratePokemonToOwnedPokemon(db)
}

// func migratePokemonToOwnedPokemon(db *gorm.DB) {
// 	if err := db.AutoMigrate(&models.User{}); err != nil {
// 		log.Fatalln(err)
// 	}
// 	if err := db.AutoMigrate(&models.OwnedPokemon{}); err != nil {
// 		log.Fatalln(err)
// 	}
// 	var users []models.User
// 	db.Preload("OwnedPokemonOld").Find(&users)
// 	for _, user := range users {
// 		for _, pokemon := range user.OwnedPokemonOld {
// 			ownedPokemon := models.OwnedPokemon{
// 				OwnerID: &user.ID,
// 				Pokemon: pokemon,
// 			}
// 			db.Create(&ownedPokemon)
// 			db.Model(&user).Association("OwnedPokemon").Append(&ownedPokemon)
// 		}
// 	}
// }
