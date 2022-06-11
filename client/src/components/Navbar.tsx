import { DISCORD_LOGIN_URL, LOGOUT_URL, userPageUrl } from "../api/links";
import Pokeball from "../assets/pokeball.png";
import NotificationIcon from "../assets/bell-solid.svg";
import FriendListIcon from "../assets/user-group-solid.svg";
import { FriendRequest, User } from "../models";
import { useEffect, useRef, useState } from "react";
import { useElementClientRect } from "../hooks/useElementClientRect";
import {
  useOnClickOutsideElement,
  useOnClickOutsideElements,
} from "../hooks/useOnClickOutsideElement";
import { deleteFriendRequest, getFriendRequests } from "../api/friendRequests";
import { postFriendship } from "../api/users";

type NavbarProps = {
  loggedInUser?: User;
  recievedFriendRequests: FriendRequest[];
};

type MenuType = "user" | "friends" | "notifications";

const Navbar = ({ loggedInUser, recievedFriendRequests }: NavbarProps) => {
  const [openMenu, setOpenMenu] = useState<MenuType | undefined>();
  const userMenu = useRef<HTMLDivElement>(null);
  const userMenuRect = useElementClientRect(userMenu);

  const notificationsMenu = useRef<HTMLDivElement>(null);
  const notificationsMenuRect = useElementClientRect(notificationsMenu);

  const friendsMenu = useRef<HTMLDivElement>(null);
  const friendsMenuRect = useElementClientRect(friendsMenu);

  useOnClickOutsideElements([userMenu, notificationsMenu, friendsMenu], () => {
    setOpenMenu(undefined);
  });

  const onClickAcceptFriendRequest = async (id: number) => {
    await postFriendship(id);
    await deleteFriendRequest(id);
    window.location.reload();
  };

  const onClickDenyFriendRequest = (id: number) => {
    deleteFriendRequest(id).then(() => window.location.reload());
  };

  return (
    <nav className="bg-white border-gray-200 px-2 sm:px-4 py-2.5 dark:bg-gray-800">
      <div className="container flex flex-wrap justify-between items-center mx-auto">
        <a href="/" className="flex items-center">
          <img src={Pokeball} className="mr-3 h-6 sm:h-9" alt="Logo" />
          <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white">
            Gokemon
          </span>
        </a>
        <div className="flex">
          {loggedInUser ? (
            <>
              <span ref={friendsMenu} className="mr-2">
                <button
                  type="button"
                  className={`flex mr-5 text-sm outline-none ${
                    openMenu === "friends" ? "brightness-75" : "brightness-100"
                  }`}
                  id="friends-menu-button"
                  aria-expanded={openMenu === "friends"}
                  data-dropdown-toggle="dropdown"
                  onClick={() =>
                    setOpenMenu(openMenu === "friends" ? undefined : "friends")
                  }
                >
                  <span className="sr-only">Open friends menu</span>
                  <img
                    className="w-8 h-8"
                    style={{ filter: "invert(100%)" }}
                    src={FriendListIcon}
                    alt="notification icon"
                  />
                </button>

                {openMenu === "friends" && (
                  <div
                    className="z-50 my-4 text-base list-none bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600"
                    style={{
                      position: "absolute",
                      inset: "0px auto auto 0px",
                      margin: "0px",
                      transform: `translate3d(${friendsMenuRect.x - 100}px, ${
                        friendsMenuRect.y + friendsMenuRect.height + 20
                      }px, 0px)`,
                    }}
                    id="dropdown"
                  >
                    <div className="py-3 px-4">
                      <span className="block text-sm text-gray-900 dark:text-white">
                        Friends
                      </span>
                    </div>
                    {loggedInUser.friends.length > 0 ? (
                      <ul className="py-1" aria-labelledby="dropdown">
                        {loggedInUser.friends.map(
                          ({ id, username, profilePictureUrl }) => (
                            <li key={id}>
                              <a
                                href={userPageUrl(username)}
                                className="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                              >
                                <img
                                  src={profilePictureUrl}
                                  className="w-8 h-8 inline mr-2 rounded-full"
                                />
                                {username}
                              </a>
                            </li>
                          )
                        )}
                      </ul>
                    ) : (
                      <div className="py-2 px-4 w-44 text-center">
                        This is awkward but... you have no friends 😅
                      </div>
                    )}
                  </div>
                )}
              </span>
              <span ref={notificationsMenu} className="mr-2">
                {recievedFriendRequests.length > 0 && (
                  <div className="w-2 h-2 animate-ping absolute inline-flex rounded-full bg-sky-400 opacity-75"></div>
                )}
                <button
                  type="button"
                  className={`flex mr-5 text-sm outline-none ${
                    openMenu === "notifications"
                      ? "brightness-75"
                      : "brightness-100"
                  }`}
                  id="notifications-menu-button"
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
                    className="w-8 h-8 rounded-full"
                    style={{ filter: "invert(100%)" }}
                    src={NotificationIcon}
                    alt="notification icon"
                  />
                </button>

                {openMenu === "notifications" && (
                  <div
                    className="z-50 my-4 text-base list-none bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600"
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
                    id="dropdown"
                  >
                    <div className="py-3 px-4">
                      <span className="block text-sm text-gray-900 dark:text-white">
                        Notifications
                      </span>
                    </div>
                    {recievedFriendRequests.length > 0 ? (
                      <ul className="py-1" aria-labelledby="dropdown">
                        {recievedFriendRequests.map(({ id, user }) => (
                          <li
                            key={id}
                            className="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                          >
                            <p>{user.username} added you!</p>
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
                      <div className="py-2 px-4 w-44 text-center">
                        You have no new notifications...
                      </div>
                    )}
                  </div>
                )}
              </span>
              <span ref={userMenu} className="mr-2">
                <button
                  type="button"
                  className="flex mr-3 text-sm rounded-full md:mr-0 outline-none"
                  id="user-menu-button"
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
                    className="z-50 my-4 text-base list-none bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600"
                    style={{
                      position: "absolute",
                      inset: "0px auto auto 0px",
                      margin: "0px",
                      transform: `translate3d(${userMenuRect.x - 60}px, ${
                        userMenuRect.y + userMenuRect.height + 20
                      }px, 0px)`,
                    }}
                    id="dropdown"
                  >
                    <div className="py-3 px-4">
                      <span className="block text-sm text-gray-900 dark:text-white">
                        {loggedInUser.username}
                      </span>
                    </div>
                    <ul className="py-1" aria-labelledby="dropdown">
                      <li>
                        <a
                          href={userPageUrl(loggedInUser.username)}
                          className="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                        >
                          Profile
                        </a>
                      </li>
                      <li>
                        <a
                          href={LOGOUT_URL}
                          className="block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
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