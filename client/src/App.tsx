import { useState, useEffect } from "react";
import { getUser } from "./api/users";
import Navbar from "./components/Navbar";
import HomePage from "./components/pages/Home";
import UserPage from "./components/pages/User";
import { UserSession } from "./models";

function App() {
  const [userSession, setUserSession] = useState<UserSession>();

  useEffect(() => {
    const userId = location.pathname.slice(1);
    getUser(userId).then((userSession) => setUserSession(userSession));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 text-white">
      {userSession ? (
        <div>
          <Navbar loggedInUser={userSession.loggedInUser} />
          <div className="p-4 mx-auto">
            {userSession.user ? (
              <UserPage
                loggedInUser={userSession.loggedInUser}
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
