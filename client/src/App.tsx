import { useState, useEffect, useRef } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { getFriendRequests } from "./api/friendRequests";
import { selectPokemon } from "./api/pokemon";
import { getTradeRequests } from "./api/tradeRequests";
import { getUser, UserSession } from "./api/users";
import Navbar from "./components/Navbar";
import HomePage from "./components/pages/Home";
import UserPage from "./components/pages/User";
import PokemonCard from "./components/PokemonCard";
import { useOnClickOutsideElements } from "./hooks/useOnClickOutsideElement";
import {
  FriendRequest,
  OwnedPokemon,
  Pokemon,
  TradeRequest,
  User,
} from "./models";

function App() {
  const [userSession, setUserSession_] = useState<UserSession>();
  const setUserSession = (userSession: UserSession) => {
    if (userSession.loggedInUser) {
      userSession.loggedInUser.ownedPokemon =
        userSession.loggedInUser.ownedPokemon.sort(
          (a, b) => a.pokemon.id - b.pokemon.id
        );
    }
    if (userSession.user) {
      userSession.user.ownedPokemon = userSession.user.ownedPokemon.sort(
        (a, b) => a.pokemon.id - b.pokemon.id
      );
    }
    setUserSession_(userSession);
  };
  const navigate = useNavigate();
  const location = useLocation();

  const selectModal = useRef<HTMLDivElement>(null);
  const selectModalButton = useRef<HTMLSpanElement>(null);
  const [selectModalOpen, setSelectModalOpen] = useState(false);

  useOnClickOutsideElements([selectModal, selectModalButton], () => {
    setSelectModalOpen(false);
  });

  const userId: string | undefined = location.pathname.slice(1);

  const getUserData = () =>
    getUser(userId).then((userSession) => setUserSession(userSession));

  useEffect(() => {
    getUser(userId).then((userSession) => {
      if (userSession?.loggedInUser && !userSession.user) {
        navigate(`/${userSession.loggedInUser.username}`, { replace: true });
        return;
      }
      setUserSession(userSession);
    });
  }, [location]);

  useEffect(() => {
    getUser(userId).then((userSession) => {
      setUserSession(userSession);
      if (userSession?.loggedInUser?.pendingPokemon.length ?? 0 > 0) {
        setSelectModalOpen(true);
      }
    });
  }, []);

  const [friendRequests, setFriendRequests] = useState<{
    sent: FriendRequest[];
    received: FriendRequest[];
  }>({ sent: [], received: [] });

  const [tradeRequests, setTradeRequests] = useState<{
    sent: TradeRequest[];
    received: TradeRequest[];
  }>({ sent: [], received: [] });

  const [secondsRemainingUntilNewPokemon, setSecondsRemainingUntilNewPokemon] =
    useState<number>();

  const getSecondsUntil = (nextTimestamp: number) => {
    const difference = nextTimestamp - Date.now();
    if (difference < 0) {
      return 0;
    }
    return Math.floor(difference / 1000);
  };

  useEffect(() => {
    if (!userSession?.loggedInUser) {
      return;
    }
    getFriendRequests().then((friendRequests) =>
      setFriendRequests(friendRequests)
    );
    getTradeRequests().then((tradeRequests) => setTradeRequests(tradeRequests));
    const nextPokemonTimestamp =
      userSession.loggedInUser.nextPokemonSelectionTimestamp;
    setSecondsRemainingUntilNewPokemon(getSecondsUntil(nextPokemonTimestamp));
    const interval = setInterval(() => {
      if (!userSession?.loggedInUser) {
        return;
      }
      const secondsRemaining = getSecondsUntil(nextPokemonTimestamp);
      setSecondsRemainingUntilNewPokemon(secondsRemaining);
      if (
        secondsRemaining === 0 &&
        userSession.loggedInUser.pendingPokemon.length === 0
      ) {
        getUser(userSession.loggedInUser.username).then(({ loggedInUser }) => {
          setUserSession({ ...userSession, loggedInUser });
          setSelectModalOpen(true);
        });
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [userSession]);

  const onClickPendingPokemon = (index: number) => {
    selectPokemon(index).then(() => {
      if (!userSession?.loggedInUser || !userSession?.user) {
        return;
      }
      const { loggedInUser, user } = userSession;
      const newLoggedInUser: User = {
        ...loggedInUser,
        pendingPokemon: [],
        ownedPokemon: [
          ...loggedInUser.ownedPokemon,
          loggedInUser.pendingPokemon[index],
        ],
      };
      const newUser: User =
        loggedInUser.id === user.id
          ? {
              ...user,
              pendingPokemon: [],
              ownedPokemon: [
                ...loggedInUser.ownedPokemon,
                loggedInUser.pendingPokemon[index],
              ],
            }
          : user;
      setUserSession({
        ...userSession,
        loggedInUser: newLoggedInUser,
        user: newUser,
      });
    });
  };

  const loggedInUserOwnedPokemonMap = (
    userSession?.loggedInUser?.ownedPokemon ?? []
  ).reduce(
    (acc, p) => ({
      ...acc,
      [p.pokemon.id]: acc[p.pokemon.id] ? [...acc[p.pokemon.id], p] : [p],
    }),
    {} as Record<number, OwnedPokemon[]>
  );
  const loggedInUserOwnsPokemon = (p: Pokemon): boolean =>
    loggedInUserOwnedPokemonMap[p.id] !== undefined;

  const userOwnedPokemonMap = (userSession?.user?.ownedPokemon ?? []).reduce(
    (acc, p) => ({
      ...acc,
      [p.pokemon.id]: acc[p.pokemon.id] ? [...acc[p.pokemon.id], p] : [p],
    }),
    {} as Record<number, OwnedPokemon[]>
  );
  const userOwnsPokemon = (p: Pokemon, formIndex?: number): boolean => {
    if (!userOwnedPokemonMap[p.id]) {
      return false;
    }
    if (formIndex !== undefined) {
      return (
        userOwnedPokemonMap[p.id].find((p) => p.formIndex === formIndex) !=
        undefined
      );
    }
    return userOwnedPokemonMap[p.id].length > 0;
  };
  const getUserOwnedPokemon = (id: number): OwnedPokemon[] | undefined =>
    userOwnedPokemonMap[id];

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 text-white">
      {userSession ? (
        <div>
          <Navbar
            loggedInUser={userSession.loggedInUser}
            friendRequests={friendRequests}
            tradeRequests={tradeRequests}
            secondsRemainingUntilNewPokemon={secondsRemainingUntilNewPokemon}
            selectModalButton={selectModalButton}
            selectModalOpen={selectModalOpen}
            setSelectModalOpen={setSelectModalOpen}
            getUserData={getUserData}
          />
          <div className="p-4 mx-auto pt-20">
            <Routes>
              <Route
                path="*"
                element={
                  userSession?.user ? (
                    <UserPage
                      loggedInUser={userSession.loggedInUser}
                      sentFriendRequests={friendRequests.sent}
                      user={userSession.user}
                      loggedInUserOwnsPokemon={loggedInUserOwnsPokemon}
                      userOwnsPokemon={userOwnsPokemon}
                      getUserOwnedPokemon={getUserOwnedPokemon}
                      getUserData={getUserData}
                    />
                  ) : (
                    <HomePage />
                  )
                }
              />
            </Routes>
          </div>
          {userSession.loggedInUser &&
            userSession.loggedInUser.pendingPokemon.length > 0 &&
            selectModalOpen && (
              <div
                ref={selectModal}
                className="mb-4 text-black fixed bg-blue-200 p-4 rounded-md top-20 left-4 right-4 z-30"
              >
                <div className="flex justify-between">
                  <h1 className="text-3xl text-center mb-5">
                    Select a Pokemon!
                  </h1>
                  <span
                    className="text-3xl cursor-pointer hover:brightness-75"
                    onClick={() => setSelectModalOpen(false)}
                  >
                    ❌
                  </span>
                </div>
                <div className="gap-2 grid grid-cols-3">
                  {userSession.loggedInUser.pendingPokemon.map((p, i) => (
                    <PokemonCard
                      key={p.id}
                      pokemon={p}
                      onClick={() => onClickPendingPokemon(i)}
                      className="relative w-full"
                      imgClassName={`${
                        loggedInUserOwnsPokemon(p.pokemon) && "grayscale"
                      }`}
                    >
                      {!loggedInUserOwnsPokemon(p.pokemon) && (
                        <span className="top-[-15px] right-[-5px] absolute text-sm text-red-500 font-bold bg-white rounded-md px-2 py-0.5">
                          NEW!
                        </span>
                      )}
                    </PokemonCard>
                  ))}
                </div>
              </div>
            )}
        </div>
      ) : (
        <div>loading...</div>
      )}
    </div>
  );
}

export default App;
