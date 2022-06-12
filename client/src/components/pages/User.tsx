import { useState, useEffect } from "react";
import {
  deleteFriendRequest,
  postFriendRequest,
} from "../../api/friendRequests";
import { userPageUrl } from "../../api/links";
import { getPokemons } from "../../api/pokemon";
import { deleteFriendship } from "../../api/users";
import { FriendRequest, Pokemon, User } from "../../models";

type UserProps = {
  loggedInUser?: User;
  sentFriendRequests: FriendRequest[];
  user: User;
};

type PokemonFilter = "all" | "owned" | "unowned";

const filteredPokemon = (
  allPokemon: Pokemon[],
  ownedPokemon: Pokemon[],
  pokemonFilter: PokemonFilter,
  ownsPokemon: (id: number) => boolean
): Pokemon[] => {
  switch (pokemonFilter) {
    case "all":
      return allPokemon;
    case "owned":
      return ownedPokemon;
    case "unowned":
      return allPokemon.filter((p) => !ownsPokemon(p.id));
  }
};

function UserPage({ user, loggedInUser, sentFriendRequests }: UserProps) {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [pokemonFilter, setPokemonFilter] = useState<PokemonFilter>("all");
  const ownedPokemonMap = (user.ownedPokemon ?? []).reduce(
    (acc, pokemon) => ({
      ...acc,
      [pokemon.id]: pokemon,
    }),
    {} as Record<number, Pokemon>
  );
  const ownsPokemon = (id: number) => ownedPokemonMap[id] !== undefined;

  const pokemons = filteredPokemon(
    allPokemon,
    user.ownedPokemon,
    pokemonFilter,
    ownsPokemon
  );

  useEffect(() => {
    getPokemons().then((pokemons) => setAllPokemon(pokemons));
  }, []);

  const onClickSendFriendRequest = () => {
    postFriendRequest(user.id).then(() => window.location.reload());
  };

  const onClickCancelFriendRequest = (id: number) => {
    deleteFriendRequest(id).then(() => window.location.reload());
  };

  const onClickRemoveFriend = (friendId: number) => {
    deleteFriendship(friendId).then(() => window.location.reload());
  };

  const canSeeFriendRequestButton = loggedInUser && user.id !== loggedInUser.id;

  const friendRequestFromLoggedInUser = sentFriendRequests.find(
    ({ user: { id } }) => id === loggedInUser?.id
  );

  const friend = loggedInUser?.friends.find(({ id }) => id === user.id);

  return (
    <div>
      <div className="flex justify-between mb-3">
        <div>
          <img
            src={user.profilePictureUrl}
            className="w-16 h-16 rounded-full inline-block mr-5"
          />
          <h2 className="text-3xl inline-block">
            {user.username}'s Pokemon - ({user.ownedPokemon.length} /{" "}
            {allPokemon.length})
          </h2>
        </div>
        {canSeeFriendRequestButton &&
          (friend ? (
            <button
              className="bg-red-500 p-3 rounded-md text-lg hover:bg-red-600 active:brightness-90"
              onClick={() => onClickRemoveFriend(friend.id)}
            >
              Remove Friend
            </button>
          ) : friendRequestFromLoggedInUser ? (
            <button
              className="bg-red-500 p-3 rounded-md text-lg hover:bg-red-600 active:brightness-90"
              onClick={() =>
                onClickCancelFriendRequest(friendRequestFromLoggedInUser.id)
              }
            >
              Cancel Friend Request
            </button>
          ) : (
            <button
              className="bg-blurple p-3 rounded-md text-lg hover:bg-dark-blurple active:brightness-90"
              onClick={onClickSendFriendRequest}
            >
              Send friend request
            </button>
          ))}
      </div>
      <div className="flex gap-2 text-lg mb-4">
        <button
          onClick={() => setPokemonFilter("all")}
          className={`cursor-pointer rounded px-4 py-2 ${
            pokemonFilter === "all" ? "bg-green-500" : "bg-green-300"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setPokemonFilter("unowned")}
          className={`cursor-pointer rounded px-4 py-2 ${
            pokemonFilter === "unowned" ? "bg-green-500" : "bg-green-300"
          }`}
        >
          Unowned
        </button>
        <button
          onClick={() => setPokemonFilter("owned")}
          className={`cursor-pointer rounded px-4 py-2 ${
            pokemonFilter === "owned" ? "bg-green-500" : "bg-green-300"
          }`}
        >
          Owned
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 ">
        {allPokemon.length === 0 ? (
          <div>loading...</div>
        ) : (
          pokemons.map(({ id, name, spriteUrl }) => (
            <div
              className="bg-slate-100 text-black rounded-lg flex flex-col p-1"
              key={id}
            >
              <h2 className="text-center text-2xl">{name}</h2>
              <img
                className={`${
                  !ownsPokemon(id) && "brightness-0"
                } [image-rendering:pixelated]`}
                src={spriteUrl}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserPage;
