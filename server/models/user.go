package models

type User struct {
	ID                uint   `json:"id" gorm:"primary_key"`
	DiscordID         string `json:"discordId"`
	Username          string `json:"username"`
	ProfilePictureURL string `json:"profilePictureUrl"`
	// OwnedPokemonOld               []Pokemon      `json:"ownedPokemon" gorm:"many2many:user_pokemon;"`
	OwnedPokemon                  []OwnedPokemon `json:"ownedPokemon" gorm:"foreignKey:OwnerID"`
	PendingPokemon                []OwnedPokemon `json:"pendingPokemon" gorm:"foreignKey:PendingOwnerID"`
	Friends                       []*User        `json:"friends" gorm:"many2many:user_friends"`
	NextPokemonSelectionTimestamp int64          `json:"nextPokemonSelectionTimestamp"`
}

type OwnedPokemon struct {
	ID             uint    `json:"id" gorm:"primary_key"`
	PokemonID      uint    `json:"pokemonId"`
	Pokemon        Pokemon `json:"pokemon"`
	OwnerID        *uint   `json:"ownerId"`
	PendingOwnerID *uint   `json:"pendingOwnerId"`
	FormIndex      uint    `json:"formIndex"`
	IsShiny        bool    `json:"isShiny"`
}

type FriendRequest struct {
	ID       uint `json:"id" gorm:"primary_key"`
	UserID   uint `json:"userId"`
	User     User `json:"user"`
	FriendID uint `json:"friendId"`
	Friend   User `json:"friend"`
}

type TradeRequest struct {
	ID              uint         `json:"id" gorm:"primary_key"`
	UserID          uint         `json:"userId"`
	User            User         `json:"user"`
	UserPokemonID   uint         `json:"userPokemonId"`
	UserPokemon     OwnedPokemon `json:"userPokemon"`
	FriendID        uint         `json:"friendId"`
	Friend          User         `json:"friend"`
	FriendPokemonID uint         `json:"friendPokemonId"`
	FriendPokemon   OwnedPokemon `json:"friendPokemon"`
}
