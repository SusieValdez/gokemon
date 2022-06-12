import { useState, useEffect } from "react";
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

  useEffect(() => {
    const userId = location.pathname.slice(1);
    getUser(userId).then((userSession) => {
      if (userSession?.loggedInUser && !userSession.user) {
        location.pathname = `/${userSession.loggedInUser.username}`;
        return;
      }
      setUserSession(userSession);
    });
  }, []);

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

  useEffect(() => {
    if (userSession?.loggedInUser) {
      getFriendRequests().then((friendRequests) =>
        setFriendRequests(friendRequests)
      );
      getTradeRequests().then((tradeRequests) =>
        setTradeRequests(tradeRequests)
      );
      const nextPokemonTimestamp =
        userSession.loggedInUser.nextPokemonSelectionTimestamp + 1000; // +1000 to ensure server has updated the pending pokemon
      setInterval(() => {
        setSecondsRemainingUntilNewPokemon(
          Math.floor((nextPokemonTimestamp - Date.now()) / 1000)
        );
      }, 1000);
      setTimeout(() => {
        getPendingPokemons().then(
          ({ pokemon }) => pokemon && setPendingPokemon(pokemon)
        );
      }, nextPokemonTimestamp - Date.now());
    }
  }, [userSession]);

  const onClickPendingPokemon = (index: number) => {
    selectPokemon(index).then(() => window.location.reload());
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 text-white">
      {userSession ? (
        <div>
          <Navbar
            loggedInUser={userSession.loggedInUser}
            recievedFriendRequests={friendRequests.recieved}
            recievedTradeRequests={tradeRequests.recieved}
            secondsRemainingUntilNewPokemon={secondsRemainingUntilNewPokemon}
          />
          <div className="p-4 mx-auto">
            {userSession.user ? (
              <UserPage
                loggedInUser={userSession.loggedInUser}
                sentFriendRequests={friendRequests.sent}
                user={userSession.user}
              />
            ) : (
              <HomePage />
            )}
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
