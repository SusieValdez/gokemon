import { useState, useEffect } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { getFriendRequests } from "./api/friendRequests";
import { getPendingPokemons, selectPokemon } from "./api/pokemon";
import { getTradeRequests } from "./api/tradeRequests";
import { getUser } from "./api/users";
import Navbar from "./components/Navbar";
import HomePage from "./components/pages/Home";
import UserPage from "./components/pages/User";
import { FriendRequest, Pokemon, TradeRequest, UserSession } from "./models";

function App() {
  const [userSession, setUserSession] = useState<UserSession>();
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
    recieved: FriendRequest[];
  }>({ sent: [], recieved: [] });

  const [tradeRequests, setTradeRequests] = useState<{
    sent: TradeRequest[];
    recieved: TradeRequest[];
  }>({ sent: [], recieved: [] });

  const [pendingPokemon, setPendingPokemon] = useState<Pokemon[]>([]);
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
      const secondsRemaining = getSecondsUntil(nextPokemonTimestamp);
      setSecondsRemainingUntilNewPokemon(secondsRemaining);
      if (secondsRemaining === 0 && pendingPokemon.length === 0) {
        getPendingPokemons().then(({ pokemon }) =>
          setPendingPokemon(pokemon ?? [])
        );
      }
    }, 1000);
    return () => {
      clearInterval(interval);
    };
  }, [userSession, pendingPokemon]);

  const onClickPendingPokemon = (index: number) => {
    selectPokemon(index).then(() => window.location.reload());
  };

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
                    />
                  ) : (
                    <HomePage />
                  )
                }
              />
            </Routes>
          </div>
          {pendingPokemon.length > 0 && (
            <div className="mb-4 text-black fixed bg-blue-200 p-4 rounded-md top-20 left-4 right-4">
              <h2 className="text-3xl">Select your new Pokemon!</h2>
              <div className="flex gap-2">
                {pendingPokemon.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex-1 outline outline-0 hover:outline-2 cursor-pointer rounded-md"
                    onClick={() => onClickPendingPokemon(i)}
                  >
                    <img
                      className="w-full [image-rendering:pixelated] "
                      src={p.spriteUrl}
                    />
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
