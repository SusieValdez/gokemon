package models

const MaxPokemonId = 898

type Pokemon struct {
	ID                   uint          `json:"id" gorm:"primary_key"`
	Name                 string        `json:"name"`
	HasGenderDifferences bool          `json:"hasGenderDifferences"`
	IsLegendary          bool          `json:"isLegendary"`
	IsMythical           bool          `json:"isMythical"`
	Forms                []PokemonForm `json:"forms"`
}

type PokemonForm struct {
	ID        uint    `json:"id" gorm:"primary_key"`
	PokemonID uint    `json:"pokemonId"`
	Name      string  `json:"name"`
	Types     []Type  `json:"types" gorm:"many2many:pokemon_types"`
	Sprites   Sprites `json:"sprites"`
}

type Sprites struct {
	ID               uint   `gorm:"primary_key"`
	PokemonFormID    uint   `json:"pokemonFormId"`
	FrontDefault     string `json:"frontDefault"`
	FrontFemale      string `json:"frontFemale"`
	FrontShiny       string `json:"frontShiny"`
	FrontShinyFemale string `json:"frontShinyFemale"`
}

type Type struct {
	Name string `json:"name" gorm:"primary_key"`
}
