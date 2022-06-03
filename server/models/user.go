package models

import "time"

type User struct {
	ID           uint      `json:"id" gorm:"primary_key"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	Username     string    `json:"username"`
	OwnedPokemon []Pokemon `json:"ownedPokemon" gorm:"many2many:user_pokemon;"`
	Friends      []*User   `json:"friends" gorm:"many2many:user_friends"`
}
