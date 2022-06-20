import { z } from "zod";
import { SERVER_BASE_URL } from "../config";
import { OwnedPokemon, Pokemon } from "../models";

export const spriteUrl = ({
  pokemon: { forms },
  formIndex,
  isShiny,
}: OwnedPokemon) => {
  const defaultForm = forms[0];
  const form = forms[formIndex];
  if (isShiny) {
    return form.sprites.frontShiny || defaultForm.sprites.frontShiny;
  }
  return form.sprites.frontDefault || defaultForm.sprites.frontDefault;
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
