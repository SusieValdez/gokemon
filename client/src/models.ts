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
