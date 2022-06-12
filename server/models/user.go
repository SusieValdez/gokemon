package models

import "time"

type User struct {
	ID                            uint      `json:"id" gorm:"primary_key"`
	DiscordID                     string    `json:"discordId"`
	CreatedAt                     time.Time `json:"created_at"`
	UpdatedAt                     time.Time `json:"updated_at"`
	Username                      string    `json:"username"`
	ProfilePictureURL             string    `json:"profilePictureUrl"`
	OwnedPokemon                  []Pokemon `json:"ownedPokemon" gorm:"many2many:user_pokemon;"`
	Friends                       []*User   `json:"friends" gorm:"many2many:user_friends"`
	NextPokemonSelectionTimestamp int64     `json:"nextPokemonSelectionTimestamp"`
}

type FriendRequest struct {
	ID        uint      `json:"id" gorm:"primary_key"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	UserID    uint      `json:"userId"`
	User      User      `json:"user"`
	FriendID  uint      `json:"friendId"`
	Friend    User      `json:"friend"`
}

type TradeRequest struct {
	ID              uint      `json:"id" gorm:"primary_key"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	UserID          uint      `json:"userId"`
	User            User      `json:"user"`
	UserPokemonID   uint      `json:"userPokemonId"`
	UserPokemon     Pokemon   `json:"userPokemon"`
	FriendID        uint      `json:"friendId"`
	Friend          User      `json:"friend"`
	FriendPokemonID uint      `json:"friendPokemonId"`
	FriendPokemon   Pokemon   `json:"friendPokemon"`
}
