package models

type Pokemon struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	SpriteUrl string `json:"spriteUrl"`
}
