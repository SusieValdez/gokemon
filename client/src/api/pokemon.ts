import { SERVER_BASE_URL } from "../config";

export const getPokemons = () =>
  fetch(`${SERVER_BASE_URL}/api/v1/pokemon`).then((res) => res.json());

export const getPendingPokemons = () =>
  fetch(`${SERVER_BASE_URL}/api/v1/pendingPokemon`, {
    credentials: "include",
  }).then((res) => res.json());

export const selectPokemon = (index: number) =>
  fetch(`${SERVER_BASE_URL}/api/v1/pendingPokemon/select`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      pendingPokemonIndex: index,
    }),
  }).then((res) => res.json());
