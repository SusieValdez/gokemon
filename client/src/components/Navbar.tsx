import { DISCORD_LOGIN_URL, LOGOUT_URL, userPageUrl } from "../api/links";
import Pokeball from "../assets/pokeball.png";
import NotificationIcon from "../assets/bell-solid.svg";
import FriendListIcon from "../assets/user-group-solid.svg";
import TradeRequestIcon from "../assets/retweet-solid.svg";
import PokeballIcon from "../assets/pokeball.svg";
import { TradeRequest, User, OwnedPokemon } from "../models";
import { useEffect, useRef, useState } from "react";
import { useElementClientRect } from "../hooks/useElementClientRect";
import { useOnClickOutsideElements } from "../hooks/useOnClickOutsideElement";
import { deleteFriendRequest, FriendRequests } from "../api/friendRequests";
import { acceptTrade, postFriendship } from "../api/users";
import { deleteTradeRequest } from "../api/tradeRequests";
import { Link, useLocation } from "react-router-dom";
import { spriteUrl } from "../api/pokemon";
import PokemonCard from "./PokemonCard";
import { notOwnedText, OwnershipStatus } from "../App";

function convertSeconds(s: number): string {
  var min = Math.floor(s / 60);
  var sec = s % 60;
  return `${min}`.padStart(2, "0") + ":" + `${sec}`.padStart(2, "0");
}

type NavbarProps = {
  loggedInUser: User | null;
  friendRequests: FriendRequests;
  tradeRequests: {
    sent: TradeRequest[];
    received: TradeRequest[];
  };
  secondsRemainingUntilNewPokemon?: number;
  selectModalButton: React.RefObject<HTMLSpanElement>;
  selectModalOpen: boolean;
  setSelectModalOpen: (open: boolean) => void;
  getUserData: () => void;
  loggedInUserPokemonOwnershipStatus: (p: OwnedPokemon) => OwnershipStatus;
};

type MenuType = "user" | "friends" | "notifications" | "trade-requests";

const Navbar = ({
  loggedInUser,
  friendRequests,
  tradeRequests,
  secondsRemainingUntilNewPokemon,
  selectModalButton,
  selectModalOpen,
  setSelectModalOpen,
  getUserData,
  loggedInUserPokemonOwnershipStatus,
}: NavbarProps) => {
  const [openMenu, setOpenMenu] = useState<MenuType | undefined>();
  const userMenu = useRef<HTMLDivElement>(null);
  const userMenuRect = useElementClientRect(userMenu);

  const notificationsMenu = useRef<HTMLDivElement>(null);
  const notificationsMenuRect = useElementClientRect(notificationsMenu);

  const tradesMenu = useRef<HTMLDivElement>(null);
  const tradesMenuRect = useElementClientRect(notificationsMenu);

  const friendsMenu = useRef<HTMLDivElement>(null);
  const friendsMenuRect = useElementClientRect(friendsMenu);

  const location = useLocation();

  useOnClickOutsideElements(
    [userMenu, notificationsMenu, friendsMenu, tradesMenu],
    () => {
      setOpenMenu(undefined);
    }
  );

  useEffect(() => {
    setOpenMenu(undefined);
  }, [location]);

  const onClickAcceptFriendRequest = async (id: number) => {
    postFriendship(id).then(() => getUserData());
  };

  const onClickDenyFriendRequest = (id: number) => {
    deleteFriendRequest(id).then(() => getUserData());
  };

  const onClickAcceptTradeRequest = async (id: number) => {
    acceptTrade(id).then(() => getUserData());
  };

  const onClickDenyTradeRequest = (id: number) => {
    deleteTradeRequest(id).then(() => getUserData());
  };

  return (
    <nav className="border-gray-200 px-2 sm:px-4 py-2.5 bg-gray-800 fixed w-full z-10">
      <div className="container flex flex-wrap justify-between items-center mx-auto">
        <Link to="/" className="flex items-center">
          <img src={Pokeball} className="ml-3 h-9 md:h-6" alt="Logo" />
          <span className="hidden md:inline-block self-center text-xl font-semibold whitespace-nowrap text-white">
            Gokemon
          </span>
        </Link>
        {secondsRemainingUntilNewPokemon !== undefined && (
          <span className="text-xl">
            {secondsRemainingUntilNewPokemon >= 0 &&
              convertSeconds(secondsRemainingUntilNewPokemon)}
          </span>
        )}
        <div className="flex items-center">
          {loggedInUser ? (
            <>
              <span ref={selectModalButton}>
                {loggedInUser.pendingPokemon.length > 0 && (
                  <div className="w-2 h-2 animate-ping absolute inline-flex rounded-full bg-red-500"></div>
                )}
                <button
                  type="button"
                  className={`flex mr-5 text-sm outline-none ${
                    loggedInUser.pendingPokemon.length > 0 && selectModalOpen
                      ? "brightness-75"
                      : "brightness-100"
                  }`}
                  aria-expanded={
                    loggedInUser.pendingPokemon.length > 0 && selectModalOpen
                  }
                  data-dropdown-toggle="dropdown"
                  onClick={() => setSelectModalOpen(!selectModalOpen)}
                >
                  <span className="sr-only">Open trade requests menu</span>
                  <img
                    className="w-6 h-6 mt-1 md:w-8 md:h-8"
                    style={{ filter: "invert(100%)" }}
                    src={PokeballIcon}
                    alt="trade request icon"
                  />
                </button>
              </span>
              <span ref={friendsMenu} className="">
                <button
                  type="button"
                  className={`flex mr-5 text-sm outline-none ${
                    openMenu === "friends" ? "brightness-75" : "brightness-100"
                  }`}
                  aria-expanded={openMenu === "friends"}
                  data-dropdown-toggle="dropdown"
                  onClick={() =>
                    setOpenMenu(openMenu === "friends" ? undefined : "friends")
                  }
                >
                  <span className="sr-only">Open friends menu</span>
                  <img
                    className="w-6 h-6 md:w-8 md:h-8"
                    style={{ filter: "invert(100%)" }}
                    src={FriendListIcon}
                    alt="notification icon"
                  />
                </button>

                {openMenu === "friends" && (
                  <div
                    className="max-h-[500px] overflow-y-auto z-50 my-4 text-base list-none rounded divide-y shadow bg-gray-700 divide-gray-600"
                    style={{
                      position: "absolute",
                      inset: "0px auto auto 0px",
                      margin: "0px",
                      transform: `translate3d(${friendsMenuRect.x - 100}px, ${
                        friendsMenuRect.y + friendsMenuRect.height + 20
                      }px, 0px)`,
                    }}
                  >
                    <div className="py-3 px-4">
                      <span className="block text-sm text-white">Friends</span>
                    </div>
                    {loggedInUser.friends.length > 0 ? (
                      <ul className="py-1" aria-labelledby="dropdown">
                        {loggedInUser.friends.map(
                          ({ id, username, profilePictureUrl }) => (
                            <li key={id}>
                              <Link
                                to={userPageUrl(username)}
                                className="block py-2 px-4 text-sm hover:bg-gray-600 text-gray-200 hover:text-white"
                              >
                                <img
                                  src={profilePictureUrl}
                                  className="w-8 h-8 inline mr-2 rounded-full"
                                />
                                {username}
                              </Link>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <div className="py-2 px-4 w-44 text-center text-sm">
                        This is awkward but... you have no friends 😅
                      </div>
                    )}
                  </div>
                )}
              </span>
              <span ref={notificationsMenu} className="">
                {friendRequests.received.length > 0 && (
                  <div className="w-2 h-2 animate-ping absolute inline-flex rounded-full bg-red-500"></div>
                )}
                <button
                  type="button"
                  className={`flex mr-5 text-sm outline-none ${
                    openMenu === "notifications"
                      ? "brightness-75"
                      : "brightness-100"
                  }`}
                  aria-expanded={openMenu === "notifications"}
                  data-dropdown-toggle="dropdown"
                  onClick={() =>
                    setOpenMenu(
                      openMenu === "notifications" ? undefined : "notifications"
                    )
                  }
                >
                  <span className="sr-only">Open notifications menu</span>
                  <img
                    className="w-6 h-6 md:w-8 md:h-8"
                    style={{ filter: "invert(100%)" }}
                    src={NotificationIcon}
                    alt="notification icon"
                  />
                </button>

                {openMenu === "notifications" && (
                  <div
                    className="max-h-[500px] overflow-y-auto z-50 my-4 text-base list-none rounded divide-y shadow bg-gray-700 divide-gray-600"
                    style={{
                      position: "absolute",
                      inset: "0px auto auto 0px",
                      margin: "0px",
                      transform: `translate3d(${
                        notificationsMenuRect.x - 120
                      }px, ${
                        notificationsMenuRect.y +
                        notificationsMenuRect.height +
                        20
                      }px, 0px)`,
                    }}
                  >
                    <div className="py-3 px-4">
                      <span className="block text-sm text-white">
                        Notifications
                      </span>
                    </div>
                    {friendRequests.received.length > 0 ? (
                      <ul className="py-1" aria-labelledby="dropdown">
                        {friendRequests.received.map(({ id, user }) => (
                          <li
                            key={id}
                            className="block py-2 px-4 text-sm hover:bg-gray-600 text-gray-200 hover:text-white"
                          >
                            <img
                              src={user.profilePictureUrl}
                              className="w-8 h-8 inline mr-2 rounded-full"
                            />
                            {user.username} added you!
                            <button
                              className="px-2 hover:brightness-75 hover:-translate-y-1"
                              onClick={() => onClickAcceptFriendRequest(id)}
                            >
                              ✅
                            </button>
                            <button
                              className="px-2 hover:brightness-75 hover:-translate-y-1"
                              onClick={() => onClickDenyFriendRequest(id)}
                            >
                              ❌
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-2 px-4 w-44 text-center text-sm">
                        You have no new notifications...
                      </div>
                    )}
                  </div>
                )}
              </span>
              <span ref={tradesMenu} className="">
                {tradeRequests.received.length > 0 && (
                  <div className="w-2 h-2 animate-ping absolute inline-flex rounded-full bg-red-500"></div>
                )}
                <button
                  type="button"
                  className={`flex mr-5 text-sm outline-none ${
                    openMenu === "trade-requests"
                      ? "brightness-75"
                      : "brightness-100"
                  }`}
                  aria-expanded={openMenu === "trade-requests"}
                  data-dropdown-toggle="dropdown"
                  onClick={() =>
                    setOpenMenu(
                      openMenu === "trade-requests"
                        ? undefined
                        : "trade-requests"
                    )
                  }
                >
                  <span className="sr-only">Open trade requests menu</span>
                  <img
                    className="w-6 h-6 md:w-8 md:h-8"
                    style={{ filter: "invert(100%)" }}
                    src={TradeRequestIcon}
                    alt="trade request icon"
                  />
                </button>

                {openMenu === "trade-requests" && (
                  <div
                    className="max-h-[500px] overflow-y-auto z-50 my-4 text-base list-none rounded divide-y shadow bg-gray-700 divide-gray-600"
                    style={{
                      position: "absolute",
                      inset: "0px auto auto 0px",
                      margin: "0px",
                      transform: `translate3d(${
                        tradesMenuRect.x -
                        (tradeRequests.received.length > 0 ||
                        tradeRequests.sent.length > 0
                          ? 242
                          : 30)
                      }px, ${
                        tradesMenuRect.y + tradesMenuRect.height + 20
                      }px, 0px)`,
                    }}
                  >
                    <div className="py-3 px-4">
                      <span className="block text-sm text-white">
                        Trade Requests
                      </span>
                    </div>
                    <div className="py-3 px-4">
                      <span className="block text-sm text-white">Sent</span>
                      {tradeRequests.sent.length > 0 ? (
                        <ul className="py-1" aria-labelledby="dropdown">
                          {tradeRequests.sent.map(
                            ({ id, friend, userPokemon, friendPokemon }) => {
                              const ownershipStatus =
                                loggedInUserPokemonOwnershipStatus(
                                  friendPokemon
                                );
                              return (
                                <li
                                  key={id}
                                  className="block py-2 px-4 text-sm hover:bg-gray-600 text-gray-200 hover:text-white"
                                >
                                  <p>
                                    <img
                                      src={friend.profilePictureUrl}
                                      className="w-8 h-8 inline mr-2 rounded-full"
                                    />
                                    You want to trade with {friend.username}!
                                  </p>

                                  <div className="flex items-center">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        Their
                                        <PokemonCard
                                          key={friendPokemon.id}
                                          pokemon={friendPokemon}
                                          className="relative w-full"
                                          imgClassName={`${
                                            ownershipStatus === "owned" &&
                                            "grayscale"
                                          }`}
                                        >
                                          {ownershipStatus !== "owned" && (
                                            <span className="top-[-15px] right-[-5px] absolute text-sm text-red-500 font-bold bg-white rounded-md px-2 py-0.5">
                                              {notOwnedText[ownershipStatus]}
                                            </span>
                                          )}
                                        </PokemonCard>
                                      </div>
                                      <div>
                                        for your
                                        <PokemonCard
                                          key={userPokemon.id}
                                          pokemon={userPokemon}
                                          className="relative w-full"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <button
                                        className="px-2 hover:brightness-75 hover:-translate-y-1"
                                        onClick={() =>
                                          onClickDenyTradeRequest(id)
                                        }
                                      >
                                        ❌
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              );
                            }
                          )}
                        </ul>
                      ) : (
                        <div className="py-2 px-4 w-44 text-center text-sm">
                          You haven't sent any trade requests...
                        </div>
                      )}
                    </div>
                    <div className="py-3 px-4">
                      <span className="block text-sm text-white">Received</span>
                      {tradeRequests.received.length > 0 ? (
                        <ul className="py-1" aria-labelledby="dropdown">
                          {tradeRequests.received.map(
                            ({ id, user, userPokemon, friendPokemon }) => {
                              const ownershipStatus =
                                loggedInUserPokemonOwnershipStatus(userPokemon);
                              return (
                                <li
                                  key={id}
                                  className="block py-2 px-4 text-sm hover:bg-gray-600 text-gray-200 hover:text-white"
                                >
                                  <p>
                                    <img
                                      src={user.profilePictureUrl}
                                      className="w-8 h-8 inline mr-2 rounded-full"
                                    />
                                    {user.username} wants to trade with you!
                                  </p>

                                  <div className="flex items-center">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        Their
                                        <PokemonCard
                                          key={userPokemon.id}
                                          pokemon={userPokemon}
                                          className="relative w-full"
                                          imgClassName={`${
                                            ownershipStatus === "owned" &&
                                            "grayscale"
                                          }`}
                                        >
                                          {ownershipStatus !== "owned" && (
                                            <span className="top-[-15px] right-[-5px] absolute text-sm text-red-500 font-bold bg-white rounded-md px-2 py-0.5">
                                              {notOwnedText[ownershipStatus]}
                                            </span>
                                          )}
                                        </PokemonCard>
                                      </div>
                                      <div>
                                        for your
                                        <PokemonCard
                                          key={friendPokemon.id}
                                          pokemon={friendPokemon}
                                          className="relative w-full"
                                        />
                                      </div>
                                    </div>
                                    <div>
                                      <button
                                        className="px-2 hover:brightness-75 hover:-translate-y-1"
                                        onClick={() =>
                                          onClickAcceptTradeRequest(id)
                                        }
                                      >
                                        ✅
                                      </button>
                                      <button
                                        className="px-2 hover:brightness-75 hover:-translate-y-1"
                                        onClick={() =>
                                          onClickDenyTradeRequest(id)
                                        }
                                      >
                                        ❌
                                      </button>
                                    </div>
                                  </div>
                                </li>
                              );
                            }
                          )}
                        </ul>
                      ) : (
                        <div className="py-2 px-4 w-44 text-center text-sm">
                          You have no new trade requests...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </span>
              <span ref={userMenu} className="mr-2">
                <button
                  type="button"
                  className="flex mr-5 text-sm rounded-full md:mr-0 outline-none"
                  aria-expanded={openMenu === "user"}
                  data-dropdown-toggle="dropdown"
                  onClick={() =>
                    setOpenMenu(openMenu === "user" ? undefined : "user")
                  }
                >
                  <span className="sr-only">Open user menu</span>
                  <img
                    className="w-8 h-8 rounded-full"
                    src={loggedInUser.profilePictureUrl}
                    alt="user photo"
                  />
                </button>

                {openMenu === "user" && (
                  <div
                    className="max-h-[500px] overflow-y-auto z-50 my-4 text-base list-none rounded divide-y shadow bg-gray-700 divide-gray-600"
                    style={{
                      position: "absolute",
                      inset: "0px auto auto 0px",
                      margin: "0px",
                      transform: `translate3d(${userMenuRect.x - 60}px, ${
                        userMenuRect.y + userMenuRect.height + 20
                      }px, 0px)`,
                    }}
                  >
                    <div className="py-3 px-4">
                      <span className="block text-sm text-white">
                        {loggedInUser.username}
                      </span>
                    </div>
                    <ul className="py-1" aria-labelledby="dropdown">
                      <li>
                        <Link
                          to={userPageUrl(loggedInUser.username)}
                          className="block py-2 px-4 text-sm hover:bg-gray-600 text-gray-200 hover:text-white"
                        >
                          Profile
                        </Link>
                      </li>
                      <li>
                        <a
                          href={LOGOUT_URL}
                          className="block py-2 px-4 text-sm hover:bg-red-600 text-red-600 hover:text-red-100"
                        >
                          Sign out
                        </a>
                      </li>
                    </ul>
                  </div>
                )}
              </span>
            </>
          ) : (
            <a href={DISCORD_LOGIN_URL}>Log In</a>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
