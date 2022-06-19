import { z } from "zod";
import { SERVER_BASE_URL } from "../config";
import { TradeRequest } from "../models";

export const TradeRequests = z.object({
  sent: z.array(TradeRequest),
  received: z.array(TradeRequest),
});
export type TradeRequests = z.infer<typeof TradeRequests>;

export const getTradeRequests = () =>
  fetch(`${SERVER_BASE_URL}/api/v1/tradeRequests`, {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((json) => TradeRequests.parse(json));

export const postTradeRequest = (
  pokemonId: number,
  friendId: number,
  friendPokemonId: number
) =>
  fetch(`${SERVER_BASE_URL}/api/v1/tradeRequests`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      pokemonId,
      friendId,
      friendPokemonId,
    }),
  }).then((res) => res.json());

export const deleteTradeRequest = (id: number) =>
  fetch(`${SERVER_BASE_URL}/api/v1/tradeRequests`, {
    method: "DELETE",
    credentials: "include",
    body: JSON.stringify({
      tradeRequestId: id,
    }),
  }).then((res) => res.json());
