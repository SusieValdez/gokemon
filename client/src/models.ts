export type Pokemon = {
  id: number;
  name: string;
  spriteUrl: string;
  types: PokemonType[];
};

export type PokemonType = {
  name: string;
};

export type OwnedPokemon = {
  id: number;
  pokemon: Pokemon;
};

export type User = {
  id: number;
  username: string;
  profilePictureUrl: string;
  ownedPokemon: OwnedPokemon[];
  pendingPokemon: OwnedPokemon[];
  friends: User[];
  nextPokemonSelectionTimestamp: number; // millis since epoch
};

export type UserSession = {
  loggedInUser?: User;
  user?: User;
};

export type FriendRequest = {
  id: number;
  user: User;
  friend: User;
};

export type TradeRequest = {
  id: number;
  user: User;
  userPokemon: OwnedPokemon;
  friend: User;
  friendPokemon: OwnedPokemon;
};
