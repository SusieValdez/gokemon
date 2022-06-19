import { z } from "zod";
import { SERVER_BASE_URL } from "../config";
import { OwnedPokemon, Pokemon } from "../models";

export const spriteUrl = (ownedPokemon: OwnedPokemon) => {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${ownedPokemon.pokemon.id}.png`;
};

export const getPokemons = async (): Promise<Pokemon[]> =>
  fetch(`${SERVER_BASE_URL}/api/v1/pokemon`)
    .then((res) => res.json())
    .then((json) => z.array(Pokemon).parse(json));

export const selectPokemon = async (index: number): Promise<string> =>
  fetch(`${SERVER_BASE_URL}/api/v1/pendingPokemon/select`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      pendingPokemonIndex: index,
    }),
  })
    .then((res) => res.json())
    .then((json) => z.string().parse(json));
