package server

import (
	"gorm.io/gorm"
	"susie.mx/gokemon/discord"
)

type Server struct {
	DB            *gorm.DB
	DiscordClient *discord.Client
	ClientBaseURL string
}
