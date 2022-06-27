import { useState, useEffect, useRef } from "react";
import Select, { createFilter } from "react-select";
import {
  deleteFriendRequest,
  postFriendRequest,
} from "../../api/friendRequests";
import { getPokemons, spriteUrl } from "../../api/pokemon";
import { postTradeRequest } from "../../api/tradeRequests";
import { deleteFriendship, updatePreferredForm } from "../../api/users";
import { useLocalStorageState } from "../../hooks/useLocalStorageState";
import {
  useOnClickOutsideElement,
  useOnClickOutsideElements,
} from "../../hooks/useOnClickOutsideElement";
import { FriendRequest, OwnedPokemon, Pokemon, User } from "../../models";
import PokemonCard from "../PokemonCard";
import EyeIcon from "../../assets/eye-solid.svg";
import { matchesQuery } from "../../utils";
import { notOwnedText, OwnershipStatus } from "../../App";

type UserProps = {
  loggedInUser: User | null;
  sentFriendRequests: FriendRequest[];
  user: User;
  loggedInUserOwnsPokemon: (p: Pokemon) => boolean;
  userOwnsPokemon: (p: Pokemon, formIndex?: number) => boolean;
  getUserOwnedPokemon: (id: number) => OwnedPokemon[] | undefined;
  getUserData: () => void;
  loggedInUserPokemonOwnershipStatus: (p: OwnedPokemon) => OwnershipStatus;
  userPokemonOwnershipStatus: (p: OwnedPokemon) => OwnershipStatus;
};

type OwnedPokemonFilter = "all" | "owned" | "unowned";
type ShinyPokemonFilter = "all" | "regular" | "shiny";
type PokemonFormFilter = "all" | "default" | "non-default";
type LegendaryPokemonFilter = "all" | "regular" | "legendary" | "mythical";

const filteredPokemon = (
  loggedInUser: User | null,
  user: User,
  allPokemon: Pokemon[],
  loggedInUserPokemonFilter: OwnedPokemonFilter,
  loggedInUserOwnsPokemon: (p: Pokemon) => boolean,
  userPokemonFilter: OwnedPokemonFilter,
  userOwnsPokemon: (p: Pokemon) => boolean,
  searchPokemonQuery: string,
  getUserOwnedPokemon: (id: number) => OwnedPokemon[] | undefined,
  shinyPokemonFilter: ShinyPokemonFilter,
  pokemonFormFilter: PokemonFormFilter,
  legendaryPokemonFilter: LegendaryPokemonFilter
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
  switch (shinyPokemonFilter) {
    case "all":
      break;
    case "regular":
      pokemon = pokemon.filter((p) => {
        const ownedPokemon = getUserOwnedPokemon(p.id);
        if (!ownedPokemon) {
          return false;
        }
        for (const op of ownedPokemon) {
          if (!op.isShiny) {
            return true;
          }
        }
        return false;
      });
      break;
    case "shiny":
      pokemon = pokemon.filter((p) => {
        const ownedPokemon = getUserOwnedPokemon(p.id);
        if (!ownedPokemon) {
          return false;
        }
        for (const op of ownedPokemon) {
          if (op.isShiny) {
            return true;
          }
        }
        return false;
      });
      break;
  }
  switch (pokemonFormFilter) {
    case "all":
      break;
    case "default":
      pokemon = pokemon.filter((p) => {
        const ownedPokemon = getUserOwnedPokemon(p.id);
        if (!ownedPokemon) {
          return false;
        }
        for (const op of ownedPokemon) {
          if (op.formIndex === 0) {
            return true;
          }
        }
        return false;
      });
      break;
    case "non-default":
      pokemon = pokemon.filter((p) => {
        const ownedPokemon = getUserOwnedPokemon(p.id);
        if (!ownedPokemon) {
          return false;
        }
        for (const op of ownedPokemon) {
          if (op.formIndex > 0) {
            return true;
          }
        }
        return false;
      });
      break;
  }
  switch (legendaryPokemonFilter) {
    case "all":
      break;
    case "legendary":
      pokemon = pokemon.filter((p) => p.isLegendary);
      break;
    case "mythical":
      pokemon = pokemon.filter((p) => p.isMythical);
      break;
    case "regular":
      pokemon = pokemon.filter((p) => !p.isLegendary && !p.isMythical);
      break;
  }
  pokemon = pokemon.filter((p) =>
    matchesQuery(`${p.name}${p.id}`, searchPokemonQuery)
  );
  return pokemon;
};

function UserPage({
  user,
  loggedInUser,
  sentFriendRequests,
  loggedInUserOwnsPokemon,
  userOwnsPokemon,
  getUserOwnedPokemon,
  getUserData,
  loggedInUserPokemonOwnershipStatus,
  userPokemonOwnershipStatus,
}: UserProps) {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);

  const [userPokemonFilter, setUserPokemonFilter] =
    useLocalStorageState<OwnedPokemonFilter>("userPokemonFilter", "owned");
  const [loggedInUserPokemonFilter, setLoggedInUserPokemonFilter] =
    useLocalStorageState<OwnedPokemonFilter>(
      "loggedInUserPokemonFilter",
      "all"
    );
  const [shinyPokemonFilter, setShinyPokemonFilter] =
    useLocalStorageState<ShinyPokemonFilter>("shinyPokemonFilter", "all");
  const [pokemonFormFilter, setFormPokemonFilter] =
    useLocalStorageState<PokemonFormFilter>("pokemonFormFilter", "all");
  const [legendaryPokemonFilter, setLegendaryPokemonFilter] =
    useLocalStorageState<LegendaryPokemonFilter>(
      "legendaryPokemonFilter",
      "all"
    );

  const [selectedSpecies, setSelectedSpecies] = useState<Pokemon>();

  const [offeredPokemon, setOfferedPokemon] = useState<
    OwnedPokemon | undefined
  >(loggedInUser?.ownedPokemon[0]);
  const [wantedPokemon, setWantedPokemon] = useState<
    OwnedPokemon | undefined
  >();

  const [searchPokemonQuery, setSearchPokemonQuery] = useState("");

  const pokemons = filteredPokemon(
    loggedInUser,
    user,
    allPokemon,
    loggedInUserPokemonFilter,
    loggedInUserOwnsPokemon,
    userPokemonFilter,
    userOwnsPokemon,
    searchPokemonQuery,
    getUserOwnedPokemon,
    shinyPokemonFilter,
    pokemonFormFilter,
    legendaryPokemonFilter
  );

  const tradeModal = useRef<HTMLDivElement>(null);

  useOnClickOutsideElement(tradeModal, () => {
    setWantedPokemon(undefined);
  });

  const selectedSpeciesModal = useRef<HTMLDivElement>(null);

  useOnClickOutsideElements([tradeModal, selectedSpeciesModal], () => {
    setSelectedSpecies(undefined);
    setWantedPokemon(undefined);
  });

  useEffect(() => {
    getPokemons().then((pokemons) => setAllPokemon(pokemons));
  }, []);

  const onClickSendFriendRequest = () => {
    postFriendRequest(user.id).then(() => getUserData());
  };

  const onClickCancelFriendRequest = (id: number) => {
    deleteFriendRequest(id).then(() => getUserData());
  };

  const onClickRemoveFriend = (friendId: number) => {
    deleteFriendship(friendId).then(() => getUserData());
  };

  const onClickSendTradeRequest = () => {
    if (!offeredPokemon || !wantedPokemon) {
      return;
    }
    postTradeRequest(offeredPokemon.id, user.id, wantedPokemon.id).then(() => {
      setWantedPokemon(undefined);
      getUserData();
    });
  };

  const onClickUpdatePreferredFormButton = (
    pokemonId: number,
    formIndex: number
  ) => {
    updatePreferredForm(pokemonId, formIndex).then(() => {
      getUserData();
    });
  };

  const canInteractWithUser = loggedInUser && user.id !== loggedInUser.id;

  const friendRequestFromLoggedInUser = sentFriendRequests.find(
    ({ user: { id }, friend: { id: fid } }) =>
      id === loggedInUser?.id && fid === user.id
  );

  const friend = loggedInUser?.friends.find(({ id }) => id === user.id);

  const loggedInUserOwnershipStatus =
    wantedPokemon && loggedInUserPokemonOwnershipStatus(wantedPokemon);
  const userOwnershipStatus =
    offeredPokemon && userPokemonOwnershipStatus(offeredPokemon);

  return (
    <div>
      <div className="flex justify-between items-center mb-10">
        <div className="flex gap-1 items-center md:gap-3">
          <img
            src={user.profilePictureUrl}
            className="w-16 h-16 rounded-full inline-block"
          />
          <h2 className="text-lg font-semibold md:text-3xl flex flex-col">
            {user.username}'s Pokemon
            <span className="text-sm font-light">
              ({user.ownedPokemon.length} / {allPokemon.length}){" "}
            </span>
          </h2>
        </div>
        {canInteractWithUser &&
          (friend ? (
            <button
              className="w-fit h-fit text-xs bg-red-500 p-2 sm:p-3 rounded-md md:text-lg hover:bg-red-600 active:brightness-90 md:w-fit"
              onClick={() => onClickRemoveFriend(friend.id)}
            >
              Remove Friend
            </button>
          ) : friendRequestFromLoggedInUser ? (
            <button
              className="w-fit h-fit text-xs bg-red-500 p-2 sm:p-3 rounded-md md:text-lg hover:bg-red-600 active:brightness-90 md:w-fit"
              onClick={() =>
                onClickCancelFriendRequest(friendRequestFromLoggedInUser.id)
              }
            >
              Cancel Friend Request
            </button>
          ) : (
            <button
              className="w-fit h-fit text-xs bg-blurple p-2 sm:p-3 rounded-md md:text-lg hover:bg-dark-blurple active:brightness-90 md:w-fit"
              onClick={onClickSendFriendRequest}
            >
              Send friend request
            </button>
          ))}
      </div>

      <div>
        <label className="text-lg mr-3 font-semibold">
          Search Pokemon Name:
        </label>
        <input
          type="text"
          name="pokemon-name"
          placeholder="Pokemon Name"
          onChange={(e) => {
            setSearchPokemonQuery(e.target.value);
          }}
          className="shadow mb-3 appearance-none border rounded w-full md:w-1/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
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

      <div className="w-96">
        <div className="flex justify-between text-sm md:text-lg mb-4 items-center">
          <p>Shiny Filter</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShinyPokemonFilter("all")}
              className={`cursor-pointer rounded px-4 py-1 ${
                shinyPokemonFilter === "all"
                  ? "bg-emerald-500"
                  : "bg-emerald-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setShinyPokemonFilter("regular")}
              className={`cursor-pointer rounded px-4 py-1 ${
                shinyPokemonFilter === "regular"
                  ? "bg-emerald-500"
                  : "bg-emerald-300"
              }`}
            >
              Regular
            </button>
            <button
              onClick={() => setShinyPokemonFilter("shiny")}
              className={`cursor-pointer rounded px-4 py-1 ${
                shinyPokemonFilter === "shiny"
                  ? "bg-emerald-500"
                  : "bg-emerald-300"
              }`}
            >
              Shiny
            </button>
          </div>
        </div>
      </div>

      <div className="w-96">
        <div className="flex justify-between text-sm md:text-lg mb-4 items-center">
          <p>Form Filter</p>
          <div className="flex gap-2">
            <button
              onClick={() => setFormPokemonFilter("all")}
              className={`cursor-pointer rounded px-4 py-1 ${
                pokemonFormFilter === "all"
                  ? "bg-emerald-500"
                  : "bg-emerald-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFormPokemonFilter("default")}
              className={`cursor-pointer rounded px-4 py-1 ${
                pokemonFormFilter === "default"
                  ? "bg-emerald-500"
                  : "bg-emerald-300"
              }`}
            >
              Default
            </button>
            <button
              onClick={() => setFormPokemonFilter("non-default")}
              className={`cursor-pointer rounded px-4 py-1 ${
                pokemonFormFilter === "non-default"
                  ? "bg-emerald-500"
                  : "bg-emerald-300"
              }`}
            >
              Variations
            </button>
          </div>
        </div>
      </div>

      <div className="w-96">
        <div className="flex justify-between text-sm md:text-lg mb-4 items-center">
          <p>Legendary Filter</p>
          <div className="flex gap-2">
            <button
              onClick={() => setLegendaryPokemonFilter("all")}
              className={`cursor-pointer rounded px-4 py-1 ${
                legendaryPokemonFilter === "all"
                  ? "bg-emerald-500"
                  : "bg-emerald-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setLegendaryPokemonFilter("regular")}
              className={`cursor-pointer rounded px-4 py-1 ${
                legendaryPokemonFilter === "regular"
                  ? "bg-emerald-500"
                  : "bg-emerald-300"
              }`}
            >
              Regular
            </button>
            <button
              onClick={() => setLegendaryPokemonFilter("legendary")}
              className={`cursor-pointer rounded px-4 py-1 ${
                legendaryPokemonFilter === "legendary"
                  ? "bg-emerald-500"
                  : "bg-emerald-300"
              }`}
            >
              Legendary
            </button>
            <button
              onClick={() => setLegendaryPokemonFilter("mythical")}
              className={`cursor-pointer rounded px-4 py-1 ${
                legendaryPokemonFilter === "mythical"
                  ? "bg-emerald-500"
                  : "bg-emerald-300"
              }`}
            >
              Mythical
            </button>
          </div>
        </div>
      </div>

      {loggedInUser && wantedPokemon && offeredPokemon && (
        <div
          ref={tradeModal}
          className="mb-4 text-black fixed bg-blue-200 p-4 rounded-md top-10 left-4 right-4 z-20"
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

          <div className="grid grid-cols-2 gap-2">
            <label className="block mb-2 text-sm font-medium ">
              {loggedInUser.username}'s Pokemon
            </label>
            <label className="block mb-2 text-sm font-medium ">
              {user.username}'s Pokemon
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              className="mb-5"
              filterOption={createFilter({
                ignoreCase: true,
                ignoreAccents: true,
                matchFrom: "any",
                stringify: (option) =>
                  (option.data.value.isShiny ? "Shiny " : "") +
                  option.data.value.pokemon.forms[option.data.value.formIndex]
                    .name,
                trim: true,
              })}
              options={loggedInUser.ownedPokemon.map((p) => {
                const userOwnershipStatus = userPokemonOwnershipStatus(p);
                return {
                  value: p,
                  label: (
                    <div className="flex items-center">
                      <img src={spriteUrl(p)} />
                      <div className="flex flex-col">
                        <div className="text-sm font-bold">
                          {userOwnershipStatus &&
                            (userOwnershipStatus === "owned" ? (
                              <span className="text-gray-600">
                                ALREADY OWNED!
                              </span>
                            ) : (
                              <span className="text-red-500">
                                {notOwnedText[userOwnershipStatus]}
                              </span>
                            ))}
                        </div>
                        <div>
                          {p.isShiny ? "Shiny " : ""}
                          {p.pokemon.forms[p.formIndex].name}
                        </div>
                      </div>
                    </div>
                  ),
                };
              })}
              value={{
                value: offeredPokemon,
                label: (
                  <div className="flex items-center">
                    <img src={spriteUrl(offeredPokemon)} />
                    <div className="flex flex-col">
                      <div className="text-sm font-bold">
                        {userOwnershipStatus &&
                          (userOwnershipStatus === "owned" ? (
                            <span className="text-gray-600">
                              ALREADY OWNED!
                            </span>
                          ) : (
                            <span className="text-red-500">
                              {notOwnedText[userOwnershipStatus]}
                            </span>
                          ))}
                      </div>
                      <div>
                        {offeredPokemon.isShiny ? "Shiny " : ""}
                        {
                          offeredPokemon.pokemon.forms[offeredPokemon.formIndex]
                            .name
                        }
                      </div>
                    </div>
                  </div>
                ),
              }}
              onChange={(e) => {
                e?.value && setOfferedPokemon(e.value);
              }}
            />
            <Select
              className="mb-5"
              filterOption={createFilter({
                ignoreCase: true,
                ignoreAccents: true,
                matchFrom: "any",
                stringify: (option) =>
                  (option.data.value.isShiny ? "Shiny " : "") +
                  option.data.value.pokemon.forms[option.data.value.formIndex]
                    .name,
                trim: true,
              })}
              value={{
                value: wantedPokemon,
                label: (
                  <div className="flex items-center">
                    <img src={spriteUrl(wantedPokemon)} />
                    <div className="flex flex-col">
                      <div className="text-sm font-bold">
                        {loggedInUserOwnershipStatus &&
                          (loggedInUserOwnershipStatus === "owned" ? (
                            <span className="text-gray-600">
                              ALREADY OWNED!
                            </span>
                          ) : (
                            <span className="text-red-500">
                              {notOwnedText[loggedInUserOwnershipStatus]}
                            </span>
                          ))}
                      </div>
                      <div>
                        {wantedPokemon.isShiny ? "Shiny " : ""}
                        {
                          wantedPokemon.pokemon.forms[wantedPokemon.formIndex]
                            .name
                        }
                      </div>
                    </div>
                  </div>
                ),
              }}
              options={user.ownedPokemon.map((p) => {
                const loggedInUserOwnershipStatus =
                  loggedInUserPokemonOwnershipStatus(p);
                return {
                  value: p,
                  label: (
                    <div className="flex items-center">
                      <img src={spriteUrl(p)} />
                      <div className="flex flex-col">
                        <div className="text-sm font-bold">
                          {loggedInUserOwnershipStatus &&
                            (loggedInUserOwnershipStatus === "owned" ? (
                              <span className="text-gray-600">
                                ALREADY OWNED!
                              </span>
                            ) : (
                              <span className="text-red-500">
                                {notOwnedText[loggedInUserOwnershipStatus]}
                              </span>
                            ))}
                        </div>
                        <div>
                          {p.isShiny ? "Shiny " : ""}
                          {p.pokemon.forms[p.formIndex].name}
                        </div>
                      </div>
                    </div>
                  ),
                };
              })}
              onChange={(e) => {
                e?.value && setWantedPokemon(e.value);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-5">
            <PokemonCard
              pokemon={offeredPokemon}
              className="relative w-full max-h-[50vh]"
              imgClassName={`max-w-[40vh] m-auto ${
                userOwnershipStatus === "owned" && "grayscale"
              }`}
            >
              {userOwnershipStatus && (
                <span className="top-[-15px] right-[-5px] absolute text-sm font-bold bg-white rounded-md px-2 py-0.5">
                  {userOwnershipStatus === "owned" ? (
                    <span className="text-gray-600">ALREADY OWNED!</span>
                  ) : (
                    <span className="text-red-500">
                      {notOwnedText[userOwnershipStatus]}
                    </span>
                  )}
                </span>
              )}
            </PokemonCard>
            <PokemonCard
              pokemon={wantedPokemon}
              className="relative w-full max-h-[50vh]"
              imgClassName={`max-w-[40vh] m-auto ${
                loggedInUserOwnershipStatus === "owned" && "grayscale"
              }`}
            >
              {loggedInUserOwnershipStatus && (
                <span className="top-[-15px] right-[-5px] absolute text-sm font-bold bg-white rounded-md px-2 py-0.5">
                  {loggedInUserOwnershipStatus === "owned" ? (
                    <span className="text-gray-600">ALREADY OWNED!</span>
                  ) : (
                    <span className="text-red-500">
                      {notOwnedText[loggedInUserOwnershipStatus]}
                    </span>
                  )}
                </span>
              )}
            </PokemonCard>
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

      {selectedSpecies && (
        <div
          ref={selectedSpeciesModal}
          className="mb-4 text-black fixed bg-blue-200 p-4 rounded-md top-10 left-4 right-4 z-10"
        >
          <div className="flex justify-between">
            <h1 className="text-3xl text-center mb-5">
              {selectedSpecies.name} Variations
            </h1>
            <span
              className="text-3xl cursor-pointer hover:brightness-75"
              onClick={() => setSelectedSpecies(undefined)}
            >
              ❌
            </span>
          </div>
          <div className="bg-white p-6 rounded-md grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 overflow-scroll max-h-[75vh]">
            {selectedSpecies.forms.map((form, i) => {
              const pokemonFormMultiples = getUserOwnedPokemon(
                selectedSpecies.id
              )?.filter(({ formIndex }) => formIndex === i);
              const preferredFormIndex =
                user.preferredForms && user.preferredForms[selectedSpecies.id];
              if (pokemonFormMultiples && pokemonFormMultiples.length > 0) {
                return pokemonFormMultiples.map((o) => (
                  <PokemonCard
                    key={o.id}
                    pokemon={o}
                    onClick={() => {
                      if (canInteractWithUser) {
                        setWantedPokemon(o);
                      }
                    }}
                    className="relative"
                  >
                    {loggedInUser?.id === user.id && (
                      <button
                        type="button"
                        onClick={() =>
                          onClickUpdatePreferredFormButton(
                            selectedSpecies.id,
                            i
                          )
                        }
                        className="hover:brightness-75"
                      >
                        <img
                          className="w-6 h-6 mt-1 md:w-8 md:h-8"
                          style={{
                            filter:
                              preferredFormIndex === i ? "" : "invert(100%)",
                          }}
                          src={EyeIcon}
                          alt="trade request icon"
                        />
                      </button>
                    )}
                  </PokemonCard>
                ));
              }
              return (
                <PokemonCard
                  key={form.id}
                  pokemon={{
                    id: 0,
                    pokemon: selectedSpecies,
                    formIndex: i,
                    isShiny: false,
                  }}
                  className="relative"
                  imgClassName={"brightness-0"}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-md grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
        {allPokemon.length === 0 ? (
          <div>loading...</div>
        ) : (
          pokemons.map((p) => {
            const preferredFormIndex =
              user.preferredForms && user.preferredForms[p.id];
            const userOwnedPokemons = getUserOwnedPokemon(p.id)?.sort(
              (a, b) => a.formIndex - b.formIndex
            );
            const preferredOwnedPokemon = userOwnedPokemons?.find(
              ({ formIndex }) => formIndex === preferredFormIndex
            );
            const userOwnedPokemon =
              preferredOwnedPokemon ??
              (userOwnedPokemons && userOwnedPokemons[0]);
            return (
              <PokemonCard
                key={p.id}
                pokemon={
                  userOwnedPokemon ?? {
                    id: 0,
                    pokemon: p,
                    formIndex: 0,
                    isShiny: false,
                  }
                }
                onClick={() => {
                  if (userOwnedPokemons?.length === 1) {
                    if (canInteractWithUser) {
                      setWantedPokemon(userOwnedPokemon);
                    }
                  } else {
                    setSelectedSpecies(p);
                  }
                }}
                imgClassName={`${
                  userOwnedPokemon === undefined && "brightness-0"
                }`}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default UserPage;
