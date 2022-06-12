package models

import (
	"time"
)

const MaxPokemonId = 898

type Pokemon struct {
	ID        uint      `json:"id" gorm:"primary_key"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Name      string    `json:"name"`
	SpriteUrl string    `json:"spriteUrl"`
	Types     []Type    `json:"types" gorm:"many2many:pokemon_types"`
}

type Type struct {
	Name string `json:"name" gorm:"primary_key"`
}

type PendingPokemon struct {
	ID      uint      `json:"id" gorm:"primary_key"`
	UserID  uint      `json:"user_id"`
	User    User      `json:"user"`
	Pokemon []Pokemon `json:"pokemon" gorm:"many2many:pending_pokemon"`
}
