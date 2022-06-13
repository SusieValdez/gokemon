import { useState, useEffect, useRef } from "react";
import Select, { createFilter } from "react-select";
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

const pokemomTypeColors: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

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
    ({ user: { id }, friend: { id: fid } }) =>
      id === loggedInUser?.id && fid === user.id
  );

  const friend = loggedInUser?.friends.find(({ id }) => id === user.id);

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div className="flex gap-1 items-center md:gap-3">
          <img
            src={user.profilePictureUrl}
            className="w-16 h-16 rounded-full inline-block"
          />
          <h2 className="text-lg font-semibold whitespace-nowrap md:text-3xl flex flex-col">
            {user.username}'s Pokemon
            <span className="text-sm font-light">
              ({user.ownedPokemon.length} / {allPokemon.length}){" "}
            </span>
          </h2>
        </div>
        {canInteractWithUser &&
          (friend ? (
            <button
              className="w-fit h-fit text-xs bg-red-500 p-3 rounded-md md:text-lg hover:bg-red-600 active:brightness-90 md:w-fit"
              onClick={() => onClickRemoveFriend(friend.id)}
            >
              Remove Friend
            </button>
          ) : friendRequestFromLoggedInUser ? (
            <button
              className="w-fit h-fit text-xs bg-red-500 p-3 rounded-md md:text-lg hover:bg-red-600 active:brightness-90 md:w-fit"
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
        <div className="md:w-96">
          <div className="flex justify-between text-sm md:text-lg mb-4 items-center">
            <p>{user.username}'s Filter</p>
            <div className="flex gap-2">
              <button
                onClick={() => setUserPokemonFilter("all")}
                className={`cursor-pointer rounded px-4 py-1 ${
                  userPokemonFilter === "all"
                    ? "bg-emerald-500"
                    : "bg-emerald-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setUserPokemonFilter("unowned")}
                className={`cursor-pointer rounded px-4 py-1 ${
                  userPokemonFilter === "unowned"
                    ? "bg-emerald-500"
                    : "bg-emerald-300"
                }`}
              >
                Unowned
              </button>
              <button
                onClick={() => setUserPokemonFilter("owned")}
                className={`cursor-pointer rounded px-4 py-1 ${
                  userPokemonFilter === "owned"
                    ? "bg-emerald-500"
                    : "bg-emerald-300"
                }`}
              >
                Owned
              </button>
            </div>
          </div>
        </div>
      )}

      {loggedInUser && (
        <div className="w-96">
          <div className="flex justify-between text-sm md:text-lg mb-4 items-center">
            Your Filter
            <div className="flex gap-2">
              <button
                onClick={() => setLoggedInUserPokemonFilter("all")}
                className={`cursor-pointer rounded px-4 py-1 ${
                  loggedInUserPokemonFilter === "all"
                    ? "bg-purple-500"
                    : "bg-purple-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setLoggedInUserPokemonFilter("unowned")}
                className={`cursor-pointer rounded px-4 py-1 ${
                  loggedInUserPokemonFilter === "unowned"
                    ? "bg-purple-500"
                    : "bg-purple-300"
                }`}
              >
                Unowned
              </button>
              <button
                onClick={() => setLoggedInUserPokemonFilter("owned")}
                className={`cursor-pointer rounded px-4 py-1 ${
                  loggedInUserPokemonFilter === "owned"
                    ? "bg-purple-500"
                    : "bg-purple-300"
                }`}
              >
                Owned
              </button>
            </div>
          </div>
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

          <div className="flex gap-2 justify-between">
            <div className="flex-1">
              <label className="block mb-2 text-sm font-medium ">
                {loggedInUser.username}'s Pokemon
              </label>
              <Select
                filterOption={createFilter({
                  ignoreCase: true,
                  ignoreAccents: true,
                  matchFrom: "any",
                  stringify: (option) =>
                    loggedInUserOwnedPokemonMap[parseInt(option.value)].name,
                  trim: true,
                })}
                options={loggedInUser.ownedPokemon.map((p) => ({
                  value: p.id,
                  label: (
                    <div className="flex items-center">
                      <img src={p.spriteUrl} />
                      {p.name}
                    </div>
                  ),
                }))}
                value={{
                  value: offeredPokemon.id,
                  label: (
                    <div className="flex items-center">
                      <img src={offeredPokemon.spriteUrl} />
                      {offeredPokemon.name}
                    </div>
                  ),
                }}
                onChange={(e) => {
                  e?.value &&
                    setOfferedPokemon(loggedInUserOwnedPokemonMap[e.value]);
                }}
              />
              <img
                src={offeredPokemon.spriteUrl}
                className="m-auto w-full max-w-[50vh] [image-rendering:pixelated] rounded-md"
                alt="user pokemon"
              />
            </div>
            <div className="flex-1">
              <label className="block mb-2 text-sm font-medium ">
                {user.username}'s Pokemon
              </label>
              <Select
                filterOption={createFilter({
                  ignoreCase: true,
                  ignoreAccents: true,
                  matchFrom: "any",
                  stringify: (option) =>
                    userOwnedPokemonMap[parseInt(option.value)].name,
                  trim: true,
                })}
                value={{
                  value: wantedPokemon.id,
                  label: (
                    <div className="flex items-center">
                      <img src={wantedPokemon.spriteUrl} />
                      {wantedPokemon.name}
                    </div>
                  ),
                }}
                options={user.ownedPokemon.map((p) => ({
                  value: p.id,
                  label: (
                    <div className="flex items-center">
                      <img src={p.spriteUrl} />
                      {p.name}
                    </div>
                  ),
                }))}
                onChange={(e) => {
                  e?.value && setWantedPokemon(userOwnedPokemonMap[e.value]);
                }}
              />
              <img
                src={wantedPokemon.spriteUrl}
                className="m-auto w-full max-w-[50vh] [image-rendering:pixelated] rounded-md"
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

      <div className="bg-white p-6 rounded-md grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 ">
        {allPokemon.length === 0 ? (
          <div>loading...</div>
        ) : (
          pokemons.map(({ id, name, spriteUrl, types }) => (
            <div
              className={`text-black rounded-lg flex flex-col p-1 cursor-pointer outline hover:outline-2 outline-0 outline-black`}
              style={{
                background:
                  types.length === 2
                    ? `linear-gradient(to bottom right, ${
                        pokemomTypeColors[types[0].name]
                      } 50%, ${pokemomTypeColors[types[1].name]} 50%)`
                    : pokemomTypeColors[types[0].name],
              }}
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
