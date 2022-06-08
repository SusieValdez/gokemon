import { SERVER_BASE_URL } from "../config";

export const getPokemons = () =>
  fetch(`${SERVER_BASE_URL}/api/v1/pokemon`).then((res) => res.json());
