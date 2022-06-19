import { useState, useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { getFriendRequests } from "./api/friendRequests";
import { selectPokemon } from "./api/pokemon";
import { getTradeRequests } from "./api/tradeRequests";
import { getUser, UserSession } from "./api/users";
import Navbar from "./components/Navbar";
import HomePage from "./components/pages/Home";
import UserPage from "./components/pages/User";
import PokemonCard from "./components/PokemonCard";
import { FriendRequest, OwnedPokemon, Pokemon, TradeRequest } from "./models";

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

  useEffect(() => {
    const userId = location.pathname.slice(1);
    getUser(userId).then((userSession) => {
      if (userSession?.loggedInUser && !userSession.user) {
        navigate(`/${userSession.loggedInUser.username}`, { replace: true });
        return;
      }
      setUserSession(userSession);
    });
  }, [location]);

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
        getUser(userSession.loggedInUser.username).then((userSession) =>
          setUserSession(userSession)
        );
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [userSession]);

  const onClickPendingPokemon = (index: number) => {
    selectPokemon(index).then(() => window.location.reload());
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
  const getLoggedInUserOwnedPokemon = (
    id: number
  ): OwnedPokemon[] | undefined => loggedInUserOwnedPokemonMap[id];

  const userOwnedPokemonMap = (userSession?.user?.ownedPokemon ?? []).reduce(
    (acc, p) => ({
      ...acc,
      [p.pokemon.id]: acc[p.pokemon.id] ? [...acc[p.pokemon.id], p] : [p],
    }),
    {} as Record<number, OwnedPokemon[]>
  );
  const userOwnsPokemon = (p: Pokemon): boolean =>
    userOwnedPokemonMap[p.id] !== undefined;
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
                      getLoggedInUserOwnedPokemon={getLoggedInUserOwnedPokemon}
                      userOwnsPokemon={userOwnsPokemon}
                      getUserOwnedPokemon={getUserOwnedPokemon}
                    />
                  ) : (
                    <HomePage />
                  )
                }
              />
            </Routes>
          </div>
          {userSession.loggedInUser &&
            userSession.loggedInUser.pendingPokemon.length > 0 && (
              <div className="mb-4 text-black fixed bg-blue-200 p-4 rounded-md top-20 left-4 right-4">
                <h2 className="text-3xl mb-4">Select a Pokemon!</h2>
                <div className="gap-2 grid grid-cols-3">
                  {userSession.loggedInUser.pendingPokemon.map((p, i) => (
                    <div key={p.id} className="relative w-full">
                      <PokemonCard
                        pokemon={p}
                        onClick={() => onClickPendingPokemon(i)}
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
                    </div>
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
