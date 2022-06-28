package commands

import (
	"fmt"
	"log"

	"github.com/bwmarrin/discordgo"
	"gorm.io/gorm"
	"susie.mx/gokemon/models"
)

func PendingPokemon(s *discordgo.Session, i *discordgo.InteractionCreate, db *gorm.DB) {
	var user models.User
	db.
		Preload("PendingPokemon.Pokemon.Forms.Sprites").
		Preload("PendingPokemon.Pokemon.Forms.Types").
		Preload("PendingPokemon.Pokemon.Forms").
		Preload("PendingPokemon.Pokemon").
		Preload("PendingPokemon").
		First(&user, "discord_id = ?", i.Member.User.ID)
	var content string
	if len(user.PendingPokemon) == 0 {
		content = fmt.Sprintf("Your next pending Pokemon arrives at %d\n", user.NextPokemonSelectionTimestamp)
	} else {
		for _, p := range user.PendingPokemon {
			content += p.Pokemon.Name + "\n"
		}
	}
	err := s.InteractionRespond(i.Interaction, &discordgo.InteractionResponse{
		Type: discordgo.InteractionResponseChannelMessageWithSource,
		Data: &discordgo.InteractionResponseData{
			Content: content,
		},
	})
	if err != nil {
		log.Printf("failed to respond to pending-pokemon: %v", err)
	}
}
