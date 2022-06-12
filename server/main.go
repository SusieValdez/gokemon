package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

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
		AllowMethods:     []string{"GET", "POST", "DELETE"},
		AllowCredentials: true,
	}))
	r.GET("/api/v1/pokemon", s.GetPokemons)

	r.GET("/api/v1/auth/discord/redirect", s.DiscordLogin)
	r.GET("/api/v1/auth/logout", s.Logout)

	r.GET("/api/v1/user/", s.GetUser)
	r.GET("/api/v1/user/:username", s.GetUser)

	r.POST("api/v1/friendships", s.PostFriendship)
	r.DELETE("api/v1/friendships", s.DeleteFriendship)

	r.POST("api/v1/acceptTrade", s.AcceptTrade)

	r.GET("/api/v1/friendRequests", s.GetFriendRequests)
	r.POST("/api/v1/friendRequests", s.PostFriendRequest)
	r.DELETE("/api/v1/friendRequests", s.DeleteFriendRequest)

	r.GET("/api/v1/tradeRequests", s.GetTradeRequests)
	r.POST("/api/v1/tradeRequests", s.PostTradeRequest)
	r.DELETE("/api/v1/tradeRequests", s.DeleteTradeRequest)

	go s.NewPokemonLoop()
	r.Run(":8080")
}
