package commands

import (
	"github.com/bwmarrin/discordgo"
	"gorm.io/gorm"
)

type Command struct {
	Information *discordgo.ApplicationCommand
	Handler     func(s *discordgo.Session, i *discordgo.InteractionCreate, db *gorm.DB)
}

var Commands = map[string]Command{
	"pending-pokemon": {
		&discordgo.ApplicationCommand{
			Name:        "pending-pokemon",
			Description: "Fetch Pending Pokemon",
		},
		PendingPokemon,
	},
}
