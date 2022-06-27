package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"susie.mx/gokemon/discord"
	"susie.mx/gokemon/models"
	"susie.mx/gokemon/server"
)

const addCommands = false

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("loading .env file failed")
	}

	rand.Seed(time.Now().Unix())

	pgUsername := os.Getenv("POSTGRES_USERNAME")
	pgPassword := os.Getenv("POSTGRES_PASSWORD")

	discordClientID := os.Getenv("DISCORD_CLIENT_ID")
	discordClientSecret := os.Getenv("DISCORD_CLIENT_SECRET")
	discordRedirectUri := os.Getenv("DISCORD_REDIRECT_URI")
	discordBotAuthToken := os.Getenv("DISCORD_BOT_AUTH_TOKEN")
	discordBotGuilds := strings.Split(os.Getenv("DISCORD_BOT_GUILDS"), ",")

	sessionStoreAuthKey := os.Getenv("SESSION_STORE_AUTH_KEY")

	clientBaseURL := os.Getenv("CLIENT_BASE_URL")

	dsn := fmt.Sprintf("host=localhost user=%s password=%s dbname=gokemon", pgUsername, pgPassword)
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %s", err)
	}

	discordClient := discord.Client{
		HTTPClient:   &http.Client{},
		ClientID:     discordClientID,
		ClientSecret: discordClientSecret,
		RedirectURI:  discordRedirectUri,
	}

	discordBotSession, err := discordgo.New("Bot " + discordBotAuthToken)
	if err != nil {
		log.Fatalf("failed to create discord session: %v", err)
	}

	discordBotSession.AddHandler(func(s *discordgo.Session, r *discordgo.Ready) {
		log.Printf("Logged in as: %s#%s", s.State.User.Username, s.State.User.Discriminator)
	})

	commands := []*discordgo.ApplicationCommand{
		{
			Name:        "pending-pokemon",
			Description: "Fetch Pending Pokemon",
		},
	}

	commandHandlers := map[string]func(s *discordgo.Session, i *discordgo.InteractionCreate){
		"pending-pokemon": func(s *discordgo.Session, i *discordgo.InteractionCreate) {
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
		},
	}

	discordBotSession.AddHandler(func(s *discordgo.Session, i *discordgo.InteractionCreate) {
		if h, ok := commandHandlers[i.ApplicationCommandData().Name]; ok {
			h(s, i)
		}
	})

	go func() {
		err := discordBotSession.Open()
		if err != nil {
			log.Fatalf("failed to open discord session: %v", err)
		}
		defer discordBotSession.Close()

		if addCommands {
			for _, guildID := range discordBotGuilds {
				log.Printf("Adding commands for Guild: %s\n", guildID)
				for _, command := range commands {
					_, err := discordBotSession.ApplicationCommandCreate(discordBotSession.State.User.ID, guildID, command)
					if err != nil {
						log.Fatalf("failed to add '%s' command: %v", command.Name, err)
					}
				}
			}
			log.Println("Finished adding commands!")
		}
	}()

	if err := db.AutoMigrate(&models.OwnedPokemon{}); err != nil {
		log.Fatalln(err)
	}
	if err := db.AutoMigrate(&models.User{}); err != nil {
		log.Fatalln(err)
	}
	if err := db.AutoMigrate(&models.Pokemon{}); err != nil {
		log.Fatalln(err)
	}
	if err := db.AutoMigrate(&models.FriendRequest{}); err != nil {
		log.Fatalln(err)
	}
	if err := db.AutoMigrate(&models.TradeRequest{}); err != nil {
		log.Fatalln(err)
	}

	s := &server.Server{
		DB:            db,
		DiscordClient: &discordClient,
		ClientBaseURL: clientBaseURL,
	}

	store := cookie.NewStore([]byte(sessionStoreAuthKey))
	store.Options(sessions.Options{Path: "/", MaxAge: 60 * 60 * 24})

	r := gin.New()
	r.Use(sessions.Sessions("session", store))
	r.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - %s\n",
			param.Method,
			param.Path,
		)
	}))
	r.Use(gin.Recovery())
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{clientBaseURL},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowCredentials: true,
	}))
	r.GET("/api/v1/pokemon", s.GetPokemons)
	r.POST("/api/v1/pendingPokemon/select", s.SelectPokemon)

	r.GET("/api/v1/auth/discord/redirect", s.DiscordLogin)
	r.GET("/api/v1/auth/logout", s.Logout)

	r.GET("/api/v1/user/", s.GetUser)
	r.GET("/api/v1/user/:username", s.GetUser)
	r.PUT("/api/v1/user/preferredForm", s.UpdatePreferredForm)

	r.POST("api/v1/friendships", s.PostFriendship)
	r.DELETE("api/v1/friendships", s.DeleteFriendship)

	r.POST("api/v1/acceptTrade", s.AcceptTrade)

	r.GET("/api/v1/friendRequests", s.GetFriendRequests)
	r.POST("/api/v1/friendRequests", s.PostFriendRequest)
	r.DELETE("/api/v1/friendRequests", s.DeleteFriendRequest)

	r.GET("/api/v1/tradeRequests", s.GetTradeRequests)
	r.POST("/api/v1/tradeRequests", s.PostTradeRequest)
	r.DELETE("/api/v1/tradeRequests", s.DeleteTradeRequest)

	var users []models.User
	s.DB.Find(&users)
	for _, user := range users {
		go s.NewPokemonTimer(user.ID)
	}
	r.Run(":8080")
}
