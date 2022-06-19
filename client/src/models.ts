import { z } from "zod";

export const PokemonType = z.object({
  name: z.string(),
});
export type PokemonType = z.infer<typeof PokemonType>;

export const Pokemon = z.object({
  id: z.number(),
  name: z.string(),
  types: z.array(PokemonType),
});
export type Pokemon = z.infer<typeof Pokemon>;

export const OwnedPokemon = z.object({
  id: z.number(),
  pokemon: Pokemon,
});
export type OwnedPokemon = z.infer<typeof OwnedPokemon>;

export const PartialUser = z.object({
  id: z.number(),
  username: z.string(),
  profilePictureUrl: z.string(),
  nextPokemonSelectionTimestamp: z.number(), // millis since epoch
});
export const User = PartialUser.extend({
  ownedPokemon: z.array(OwnedPokemon),
  pendingPokemon: z.array(OwnedPokemon),
  friends: z.array(PartialUser),
});
export type User = z.infer<typeof User>;

export const FriendRequest = z.object({
  id: z.number(),
  user: PartialUser,
  friend: PartialUser,
});
export type FriendRequest = z.infer<typeof FriendRequest>;

export const TradeRequest = z.object({
  id: z.number(),
  user: PartialUser,
  userPokemon: OwnedPokemon,
  friend: PartialUser,
  friendPokemon: OwnedPokemon,
});
export type TradeRequest = z.infer<typeof TradeRequest>;
