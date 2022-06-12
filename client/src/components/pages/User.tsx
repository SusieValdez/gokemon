import { useState, useEffect, useRef } from "react";
import {
  deleteFriendRequest,
  postFriendRequest,
} from "../../api/friendRequests";
import { getPokemons } from "../../api/pokemon";
import { postTradeRequest } from "../../api/tradeRequests";
import { deleteFriendship } from "../../api/users";
import { useElementClientRect } from "../../hooks/useElementClientRect";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { useOnClickOutsideElement } from "../../hooks/useOnClickOutsideElement";
import { FriendRequest, Pokemon, User } from "../../models";

type UserProps = {
  loggedInUser?: User;
  sentFriendRequests: FriendRequest[];
  user: User;
};

type PokemonFilter = "all" | "owned" | "unowned";

const filteredPokemon = (
  loggedInUser: User | undefined,
  user: User,
  allPokemon: Pokemon[],
  loggedInUserPokemonFilter: PokemonFilter,
  loggedInUserOwnsPokemon: (id: number) => boolean,
  userPokemonFilter: PokemonFilter,
  userOwnsPokemon: (id: number) => boolean
): Pokemon[] => {
  let pokemon = allPokemon;
  if (!loggedInUser) {
    loggedInUserPokemonFilter = "all";
  }
  if (loggedInUser && loggedInUser.id === user.id) {
    userPokemonFilter = "all";
  }
  switch (loggedInUserPokemonFilter) {
    case "all":
      break;
    case "owned":
      pokemon = pokemon.filter((p) => loggedInUserOwnsPokemon(p.id));
      break;
    case "unowned":
      pokemon = pokemon.filter((p) => !loggedInUserOwnsPokemon(p.id));
      break;
  }
  switch (userPokemonFilter) {
    case "all":
      break;
    case "owned":
      pokemon = pokemon.filter((p) => userOwnsPokemon(p.id));
      break;
    case "unowned":
      pokemon = pokemon.filter((p) => !userOwnsPokemon(p.id));
      break;
  }
  return pokemon;
};

function UserPage({ user, loggedInUser, sentFriendRequests }: UserProps) {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);

  const [userPokemonFilter, setUserPokemonFilter] =
    useLocalStorageState<PokemonFilter>("userPokemonFilter", "owned");
  const [loggedInUserPokemonFilter, setLoggedInUserPokemonFilter] =
    useLocalStorageState<PokemonFilter>("loggedInUserPokemonFilter", "all");

  const loggedInUserOwnedPokemonMap = (loggedInUser?.ownedPokemon ?? []).reduce(
    (acc, pokemon) => ({
      ...acc,
      [pokemon.id]: pokemon,
    }),
    {} as Record<number, Pokemon>
  );
  const loggedInUserOwnsPokemon = (id: number) =>
    loggedInUserOwnedPokemonMap[id] !== undefined;
  const userOwnedPokemonMap = (user.ownedPokemon ?? []).reduce(
    (acc, pokemon) => ({
      ...acc,
      [pokemon.id]: pokemon,
    }),
    {} as Record<number, Pokemon>
  );
  const userOwnsPokemon = (id: number) => userOwnedPokemonMap[id] !== undefined;

  const [offeredPokemon, setOfferedPokemon] = useState<Pokemon | undefined>(
    loggedInUser?.ownedPokemon[0]
  );
  const [wantedPokemon, setWantedPokemon] = useState<Pokemon | undefined>();

  const pokemons = filteredPokemon(
    loggedInUser,
    user,
    allPokemon,
    loggedInUserPokemonFilter,
    loggedInUserOwnsPokemon,
    userPokemonFilter,
    userOwnsPokemon
  );

  const tradeModal = useRef<HTMLDivElement>(null);

  useOnClickOutsideElement(tradeModal, () => {
    setWantedPokemon(undefined);
  });

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

  const onClickSendTradeRequest = () => {
    if (!offeredPokemon || !wantedPokemon) {
      return;
    }
    postTradeRequest(offeredPokemon.id, user.id, wantedPokemon.id).then(() =>
      window.location.reload()
    );
  };

  const canInteractWithUser = loggedInUser && user.id !== loggedInUser.id;

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
        {canInteractWithUser &&
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

      {(loggedInUser && loggedInUser.id === user.id) || (
        <div className="flex gap-2 text-lg mb-4">
          User Filter
          <button
            onClick={() => setUserPokemonFilter("all")}
            className={`cursor-pointer rounded px-4 py-2 ${
              userPokemonFilter === "all" ? "bg-green-500" : "bg-green-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setUserPokemonFilter("unowned")}
            className={`cursor-pointer rounded px-4 py-2 ${
              userPokemonFilter === "unowned" ? "bg-green-500" : "bg-green-300"
            }`}
          >
            Unowned
          </button>
          <button
            onClick={() => setUserPokemonFilter("owned")}
            className={`cursor-pointer rounded px-4 py-2 ${
              userPokemonFilter === "owned" ? "bg-green-500" : "bg-green-300"
            }`}
          >
            Owned
          </button>
        </div>
      )}

      {loggedInUser && (
        <div className="flex gap-2 text-lg mb-4">
          Your Filter
          <button
            onClick={() => setLoggedInUserPokemonFilter("all")}
            className={`cursor-pointer rounded px-4 py-2 ${
              loggedInUserPokemonFilter === "all"
                ? "bg-green-500"
                : "bg-green-300"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setLoggedInUserPokemonFilter("unowned")}
            className={`cursor-pointer rounded px-4 py-2 ${
              loggedInUserPokemonFilter === "unowned"
                ? "bg-green-500"
                : "bg-green-300"
            }`}
          >
            Unowned
          </button>
          <button
            onClick={() => setLoggedInUserPokemonFilter("owned")}
            className={`cursor-pointer rounded px-4 py-2 ${
              loggedInUserPokemonFilter === "owned"
                ? "bg-green-500"
                : "bg-green-300"
            }`}
          >
            Owned
          </button>
        </div>
      )}

      {loggedInUser && wantedPokemon && offeredPokemon && (
        <div
          ref={tradeModal}
          className="mb-4 text-black fixed bg-blue-200 p-4 rounded-md top-10 left-4 right-4"
        >
          <div className="flex justify-between">
            <h1 className="text-3xl text-center mb-5">New Trade Request</h1>
            <span
              className="text-3xl cursor-pointer hover:brightness-75"
              onClick={() => setWantedPokemon(undefined)}
            >
              ❌
            </span>
          </div>

          <div className="flex gap-2 justify-between place-items-center">
            <div className="flex-1">
              <label
                htmlFor="countries"
                className="block mb-2 text-sm font-medium "
              >
                {loggedInUser.username}'s Pokemon
              </label>
              <select
                id="countries"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={offeredPokemon.id}
                onChange={(e) => {
                  setOfferedPokemon(
                    loggedInUserOwnedPokemonMap[parseInt(e.target.value)]
                  );
                }}
              >
                {loggedInUser.ownedPokemon.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <img
                src={offeredPokemon.spriteUrl}
                className="w-full [image-rendering:pixelated] rounded-md"
                alt="user pokemon"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="countries"
                className="block mb-2 text-sm font-medium "
              >
                {user.username}'s Pokemon
              </label>
              <select
                id="countries"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                value={wantedPokemon.id}
                onChange={(e) => {
                  setWantedPokemon(
                    userOwnedPokemonMap[parseInt(e.target.value)]
                  );
                }}
              >
                {user.ownedPokemon.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <img
                src={wantedPokemon.spriteUrl}
                className="w-full [image-rendering:pixelated] rounded-md"
                alt="user pokemon"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              className="text-white bg-blurple p-3 rounded-md text-lg hover:bg-dark-blurple active:brightness-90"
              onClick={onClickSendTradeRequest}
            >
              Send Trade Request
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 ">
        {allPokemon.length === 0 ? (
          <div>loading...</div>
        ) : (
          pokemons.map(({ id, name, spriteUrl }) => (
            <div
              className="bg-slate-100 text-black rounded-lg flex flex-col p-1 cursor-pointer outline hover:outline-2 outline-0 outline-black"
              key={id}
              onClick={() => {
                if (canInteractWithUser) {
                  setWantedPokemon(userOwnedPokemonMap[id]);
                }
              }}
            >
              <h2 className="text-center text-2xl">{name}</h2>
              <img
                className={`${
                  !userOwnsPokemon(id) && "brightness-0"
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
