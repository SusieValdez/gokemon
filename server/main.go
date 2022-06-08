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
)

type Server struct {
	db            *gorm.DB
	discordClient *discord.Client
}

func (s *Server) pokemonHandler(c *gin.Context) {
	var pokemon []models.Pokemon
	s.db.Preload("Types").Find(&pokemon)
	c.JSON(http.StatusOK, pokemon)
}

func (s *Server) discordLogin(c *gin.Context) {
	authCode := c.Request.URL.Query().Get("code")
	accessToken := s.discordClient.GetAccessToken(authCode).AccessToken
	discordUser := s.discordClient.GetUser("@me", accessToken)
	username := discordUser.Username
	var user models.User
	s.db.Preload("OwnedPokemon").Preload("Friends").First(&user, "discord_id = ?", discordUser.ID)
	if user.ID == 0 {
		s.db.Create(&models.User{
			DiscordID:    discordUser.ID,
			Username:     username,
			Friends:      nil,
			OwnedPokemon: nil,
		})
	} else {
		username = user.Username
	}
	session := sessions.Default(c)
	session.Set("accessToken", accessToken)
	session.Set("username", username)
	err := session.Save()
	if err != nil {
		log.Fatalf("saving access token to session failed: %s", err)
	}
	c.Redirect(http.StatusFound, fmt.Sprintf("http://localhost:3000/%s", username))
}

func (s *Server) logout(c *gin.Context) {
	session := sessions.Default(c)
	session.Delete("accessToken")
	session.Delete("username")
	session.Save()
	c.Redirect(http.StatusFound, "http://localhost:3000")
}

func (s *Server) userHandler(c *gin.Context) {
	session := sessions.Default(c)
	loggedInUsername := session.Get("username")
	username := c.Param("username")

	obj := gin.H{
		"loggedInUser": nil,
		"user":         nil,
	}

	var loggedInUser models.User
	if loggedInUsername != "" {
		s.db.Preload("OwnedPokemon").Preload("Friends").First(&loggedInUser, "username = ?", loggedInUsername)
	}
	if loggedInUser.ID != 0 {
		obj["loggedInUser"] = loggedInUser
	}

	var user models.User
	if username != "" {
		s.db.Preload("OwnedPokemon").Preload("Friends").First(&user, "username = ?", username)
	}
	if user.ID != 0 {
		obj["user"] = user
	}

	c.JSON(http.StatusOK, obj)
}

func (s *Server) friendRequestsHandler(c *gin.Context) {
	session := sessions.Default(c)
	username := session.Get("username")
	if username == nil {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}
	var user models.User
	s.db.First(&user, "username = ?", username)
	sentFriendRequests := []models.FriendRequest{}
	s.db.Preload("User").Preload("Friend").Find(&sentFriendRequests, "user_id = ?", user.ID)
	recievedFriendRequests := []models.FriendRequest{}
	s.db.Preload("User").Preload("Friend").Find(&recievedFriendRequests, "friend_id = ?", user.ID)
	c.JSON(http.StatusOK, gin.H{
		"sent":     sentFriendRequests,
		"recieved": recievedFriendRequests,
	})
}

type FriendRequestRequest struct {
	FriendID uint `json:"friendId"`
}

func (s *Server) newFriendRequestHandler(c *gin.Context) {
	session := sessions.Default(c)
	username := session.Get("username")
	if username == nil {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}
	var user models.User
	s.db.First(&user, "username = ?", username)

	var friendRequestRequest FriendRequestRequest
	c.BindJSON(&friendRequestRequest)
	if user.ID == friendRequestRequest.FriendID {
		c.JSON(http.StatusBadRequest, nil)
		return
	}
	var friendRequest models.FriendRequest
	s.db.First(&friendRequest, "user_id = ? AND friend_id = ?", user.ID, friendRequestRequest.FriendID)

	if friendRequest.ID != 0 {
		c.JSON(http.StatusBadRequest, nil)
		return
	}
	var friend models.User
	s.db.First(&friend, friendRequestRequest.FriendID)

	s.db.Create(&models.FriendRequest{
		User:   user,
		Friend: friend,
	})
}

func (s *Server) cancelFriendRequest(c *gin.Context) {
	session := sessions.Default(c)
	username := session.Get("username")
	if username == nil {
		c.JSON(http.StatusUnauthorized, nil)
		return
	}
	var user models.User
	s.db.First(&user, "username = ?", username)

	var friendRequestRequest FriendRequestRequest
	c.BindJSON(&friendRequestRequest)
	if user.ID == friendRequestRequest.FriendID {
		c.JSON(http.StatusBadRequest, nil)
		return
	}
	var friendRequest models.FriendRequest
	s.db.Delete(&friendRequest, "user_id = ? AND friend_id = ?", user.ID, friendRequestRequest.FriendID)
}

func (s *Server) getRandomPokemon() models.Pokemon {
	randomID := rand.Intn(models.MaxPokemonId-1) + 1
	var pokemon models.Pokemon
	s.db.First(&pokemon, randomID)
	return pokemon
}

func (s *Server) newPokemonLoop() {
	ticker := time.NewTicker(5000 * time.Millisecond)
	for {
		<-ticker.C
		var users []models.User
		s.db.Find(&users)
		for _, user := range users {
			randomPokemon := s.getRandomPokemon()
			user.OwnedPokemon = append(user.OwnedPokemon, randomPokemon)
			s.db.Save(&user)
		}
	}
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("loading .env file failed")
	}

	pgUsername := os.Getenv("POSTGRES_USERNAME")
	pgPassword := os.Getenv("POSTGRES_PASSWORD")

	discordClientID := os.Getenv("DISCORD_CLIENT_ID")
	discordClientSecret := os.Getenv("DISCORD_CLIENT_SECRET")
	discordRedirectUri := os.Getenv("DISCORD_REDIRECT_URI")

	sessionStoreAuthKey := os.Getenv("SESSION_STORE_AUTH_KEY")

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

	db.AutoMigrate(&models.User{})
	db.AutoMigrate(&models.Pokemon{})
	db.AutoMigrate(&models.FriendRequest{})

	s := &Server{db: db, discordClient: &discordClient}
	go s.newPokemonLoop()

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
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "DELETE"},
		AllowCredentials: true,
	}))
	r.GET("/api/v1/pokemon", s.pokemonHandler)

	r.GET("/api/v1/auth/discord/redirect", s.discordLogin)
	r.GET("/api/v1/auth/logout", s.logout)

	r.GET("/api/v1/user/:username", s.userHandler)
	r.GET("/api/v1/user/", s.userHandler)

	r.GET("/api/v1/friendRequests", s.friendRequestsHandler)
	r.POST("/api/v1/friendRequests", s.newFriendRequestHandler)
	r.DELETE("/api/v1/friendRequests", s.cancelFriendRequest)

	r.Run(":8080")
}
