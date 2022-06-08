import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HomePage from "./components/pages/Home";
import UserPage from "./components/pages/User";
import { UserSession } from "./models";

function App() {
  const [userSession, setUserSession] = useState<UserSession>();

  useEffect(() => {
    const userId = location.pathname.slice(1);
    fetch(`http://localhost:8080/api/v1/user/${userId}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((userSession) => setUserSession(userSession));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 text-white">
      {userSession ? (
        <div>
          <Navbar userSession={userSession} />
          <div className="p-4 mx-auto">
            {userSession.user ? (
              <UserPage user={userSession.user} />
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
