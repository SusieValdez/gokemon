import { useState, useEffect } from "react";
import { getFriendRequests } from "./api/friendRequests";
import { getTradeRequests } from "./api/tradeRequests";
import { getUser } from "./api/users";
import Navbar from "./components/Navbar";
import HomePage from "./components/pages/Home";
import UserPage from "./components/pages/User";
import { FriendRequest, TradeRequest, UserSession } from "./models";

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

  useEffect(() => {
    if (userSession?.loggedInUser) {
      getFriendRequests().then((friendRequests) =>
        setFriendRequests(friendRequests)
      );
      getTradeRequests().then((tradeRequests) =>
        setTradeRequests(tradeRequests)
      );
    }
  }, [userSession]);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 text-white">
      {userSession ? (
        <div>
          <Navbar
            loggedInUser={userSession.loggedInUser}
            recievedFriendRequests={friendRequests.recieved}
            recievedTradeRequests={tradeRequests.recieved}
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
        </div>
      ) : (
        <div>loading...</div>
      )}
    </div>
  );
}

export default App;
