import { useState, useEffect, useRef } from "react";
import Select, { createFilter } from "react-select";
import {
  deleteFriendRequest,
  postFriendRequest,
} from "../../api/friendRequests";
import { getPokemons } from "../../api/pokemon";
import { postTradeRequest } from "../../api/tradeRequests";
import { deleteFriendship } from "../../api/users";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import { useOnClickOutsideElement } from "../../hooks/useOnClickOutsideElement";
import { FriendRequest, OwnedPokemon, Pokemon, User } from "../../models";
import PokemonCard from "../PokemonCard";

type UserProps = {
  loggedInUser?: User;
  sentFriendRequests: FriendRequest[];
  user: User;
  loggedInUserOwnsPokemon: (p: Pokemon) => boolean;
  getLoggedInUserOwnedPokemon: (id: number) => OwnedPokemon;
  userOwnsPokemon: (p: Pokemon) => boolean;
  getUserOwnedPokemon: (id: number) => OwnedPokemon;
};

type PokemonFilter = "all" | "owned" | "unowned";

const filteredPokemon = (
  loggedInUser: User | undefined,
  user: User,
  allPokemon: Pokemon[],
  loggedInUserPokemonFilter: PokemonFilter,
  loggedInUserOwnsPokemon: (p: Pokemon) => boolean,
  userPokemonFilter: PokemonFilter,
  userOwnsPokemon: (p: Pokemon) => boolean
): Pokemon[] => {
  let pokemon = allPokemon;
  if (!loggedInUser || loggedInUser.id === user.id) {
    loggedInUserPokemonFilter = "all";
  }
  switch (loggedInUserPokemonFilter) {
    case "all":
      break;
    case "owned":
      pokemon = pokemon.filter((p) => loggedInUserOwnsPokemon(p));
      break;
    case "unowned":
      pokemon = pokemon.filter((p) => !loggedInUserOwnsPokemon(p));
      break;
  }
  switch (userPokemonFilter) {
    case "all":
      break;
    case "owned":
      pokemon = pokemon.filter((p) => userOwnsPokemon(p));
      break;
    case "unowned":
      pokemon = pokemon.filter((p) => !userOwnsPokemon(p));
      break;
  }
  return pokemon;
};

function UserPage({
  user,
  loggedInUser,
  sentFriendRequests,
  loggedInUserOwnsPokemon,
  getLoggedInUserOwnedPokemon,
  userOwnsPokemon,
  getUserOwnedPokemon,
}: UserProps) {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);

  const [userPokemonFilter, setUserPokemonFilter] =
    useLocalStorageState<PokemonFilter>("userPokemonFilter", "owned");
  const [loggedInUserPokemonFilter, setLoggedInUserPokemonFilter] =
    useLocalStorageState<PokemonFilter>("loggedInUserPokemonFilter", "all");

  const [offeredPokemon, setOfferedPokemon] = useState<
    OwnedPokemon | undefined
  >(loggedInUser?.ownedPokemon.find((p) => !userOwnsPokemon(p.pokemon)));
  const [wantedPokemon, setWantedPokemon] = useState<
    OwnedPokemon | undefined
  >();

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
    setOfferedPokemon(
      loggedInUser?.ownedPokemon.find((p) => !userOwnsPokemon(p.pokemon))
    );
  }, [user]);

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
              className="w-fit h-fit text-xs bg-blurple p-3 rounded-md md:text-lg hover:bg-dark-blurple active:brightness-90 md:w-fit"
              onClick={onClickSendFriendRequest}
            >
              Send friend request
            </button>
          ))}
      </div>

      <div className="w-96">
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

      {loggedInUser && loggedInUser.id !== user.id && (
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

      {loggedInUser &&
        wantedPokemon &&
        offeredPokemon &&
        !loggedInUserOwnsPokemon(wantedPokemon.pokemon) &&
        !userOwnsPokemon(offeredPokemon.pokemon) && (
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
                      getLoggedInUserOwnedPokemon(parseInt(option.value))
                        .pokemon.name,
                    trim: true,
                  })}
                  options={loggedInUser.ownedPokemon
                    .filter((p) => !userOwnsPokemon(p.pokemon))
                    .map((p) => ({
                      value: p.pokemon.id,
                      label: (
                        <div className="flex items-center">
                          <img src={p.pokemon.spriteUrl} />
                          {p.pokemon.name}
                        </div>
                      ),
                    }))}
                  value={{
                    value: offeredPokemon.id,
                    label: (
                      <div className="flex items-center">
                        <img src={offeredPokemon.pokemon.spriteUrl} />
                        {offeredPokemon.pokemon.name}
                      </div>
                    ),
                  }}
                  onChange={(e) => {
                    e?.value &&
                      setOfferedPokemon(getLoggedInUserOwnedPokemon(e.value));
                  }}
                />
                <img
                  src={offeredPokemon.pokemon.spriteUrl}
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
                      getUserOwnedPokemon(parseInt(option.value)).pokemon.name,
                    trim: true,
                  })}
                  value={{
                    value: wantedPokemon.id,
                    label: (
                      <div className="flex items-center">
                        <img src={wantedPokemon.pokemon.spriteUrl} />
                        {wantedPokemon.pokemon.name}
                      </div>
                    ),
                  }}
                  options={user.ownedPokemon
                    .filter((p) => !loggedInUserOwnsPokemon(p.pokemon))
                    .map((p) => ({
                      value: p.pokemon.id,
                      label: (
                        <div className="flex items-center">
                          <img src={p.pokemon.spriteUrl} />
                          {p.pokemon.name}
                        </div>
                      ),
                    }))}
                  onChange={(e) => {
                    e?.value && setWantedPokemon(getUserOwnedPokemon(e.value));
                  }}
                />
                <img
                  src={wantedPokemon.pokemon.spriteUrl}
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
          pokemons.map((p) => (
            <PokemonCard
              key={p.id}
              pokemon={p}
              onClick={() => {
                if (canInteractWithUser) {
                  setWantedPokemon(getUserOwnedPokemon(p.id));
                }
              }}
              imgClassName={`${!userOwnsPokemon(p) && "brightness-0"}`}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default UserPage;
