package discordbot

import (
	"log"

	"github.com/bwmarrin/discordgo"
	"gorm.io/gorm"
	"susie.mx/gokemon/discordbot/commands"
)

type Bot struct {
	session  *discordgo.Session
	guildIDs []string
	db       *gorm.DB
}

func New(authToken string, guildIDs []string, db *gorm.DB) *Bot {
	session, err := discordgo.New("Bot " + authToken)
	if err != nil {
		log.Panicf("failed to create discord session: %v", err)
	}
	b := &Bot{
		session:  session,
		guildIDs: guildIDs,
		db:       db,
	}
	session.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		log.Printf("Logged in as: %s#%s", s.State.User.Username, s.State.User.Discriminator)
	})
	session.AddHandler(func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		if c, ok := commands.Commands[i.ApplicationCommandData().Name]; ok {
			c.Handler(s, i, b.db)
		}
	})
	return b
}

func (b *Bot) Start() {
	err := b.session.Open()
	if err != nil {
		log.Panicf("failed to open discord session: %v", err)
	}
	defer b.session.Close()

	for _, guildID := range b.guildIDs {
		if guildID == "" {
			continue
		}
		log.Printf("Adding commands for Guild: %s\n", guildID)
		for _, command := range commands.Commands {
			_, err := b.session.ApplicationCommandCreate(b.session.State.User.ID, guildID, command.Information)
			if err != nil {
				log.Panicf("failed to add '%s' command: %v", command.Information.Name, err)
			}
		}
	}
	log.Println("Finished adding commands!")
}
