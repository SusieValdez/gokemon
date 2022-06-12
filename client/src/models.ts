export type Pokemon = {
  id: number;
  name: string;
  spriteUrl: string;
};

export type User = {
  id: number;
  username: string;
  profilePictureUrl: string;
  ownedPokemon: Pokemon[];
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
  userPokemon: Pokemon;
  friend: User;
  friendPokemon: Pokemon;
};
