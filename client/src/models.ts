export type Pokemon = {
  id: number;
  name: string;
  spriteUrl: string;
};

export type User = {
  id: number;
  username: string;
  ownedPokemon: Pokemon[];
  friends: User[];
};

export type UserSession =
  | {
      user: User;
      loggedIn: true;
    }
  | {
      user: User;
      loggedIn: false;
    }
  | {
      user: undefined;
      loggedIn: false;
    };
