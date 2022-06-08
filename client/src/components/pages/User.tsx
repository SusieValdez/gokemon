import { useState, useEffect } from "react";
import { FriendRequest, Pokemon, User } from "../../models";

type UserProps = {
  loggedInUser?: User;
  user: User;
};

function UserPage({ user, loggedInUser }: UserProps) {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const ownedPokemonMap = (user.ownedPokemon ?? []).reduce(
    (acc, pokemon) => ({
      ...acc,
      [pokemon.id]: pokemon,
    }),
    {} as Record<number, Pokemon>
  );
  const ownsPokemon = (id: number) => ownedPokemonMap[id] !== undefined;

  const [friendRequests, setFriendRequests] = useState<{
    sent: FriendRequest[];
    recieved: FriendRequest[];
  }>({ sent: [], recieved: [] });

  useEffect(() => {
    fetch(`http://localhost:8080/api/v1/pokemon`)
      .then((res) => res.json())
      .then((pokemons) => setPokemons(pokemons));
    if (loggedInUser) {
      fetch(`http://localhost:8080/api/v1/friendRequests`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((friendRequests) => setFriendRequests(friendRequests));
    }
  }, []);

  const onClickSendFriendRequest = () => {
    fetch(`http://localhost:8080/api/v1/friendRequests`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({
        friendId: user.id,
      }),
    }).then(() => window.location.reload());
  };

  const onClickCancelFriendRequest = () => {
    fetch(`http://localhost:8080/api/v1/friendRequests`, {
      method: "DELETE",
      credentials: "include",
      body: JSON.stringify({
        friendId: user.id,
      }),
    }).then(() => window.location.reload());
  };

  const canSeeFriendRequestButton = loggedInUser && loggedInUser.id !== user.id;

  const userHasFriendRequestFromLoggedInUser =
    loggedInUser &&
    friendRequests.sent.some(({ user: { id } }) => id === loggedInUser.id);

  return (
    <div>
      <div className="flex justify-between mb-3">
        <img src={user.profilePictureUrl} className="w-8 h-8 rounded-full" />
        <h2 className="text-3xl ">
          {user.username}'s Pokemon - ({user.ownedPokemon.length} /{" "}
          {pokemons.length})
        </h2>
        {canSeeFriendRequestButton &&
          (userHasFriendRequestFromLoggedInUser ? (
            <button
              className="bg-red-500 p-3 rounded-md text-lg hover:bg-red-600 active:brightness-90"
              onClick={onClickCancelFriendRequest}
            >
              Cancel Friend Request
            </button>
          ) : (
            <button
              className="bg-blurple p-3 rounded-md text-lg hover:bg-dark-blurple active:brightness-90"
              onClick={onClickSendFriendRequest}
            >
              Send friend request
            </button>
          ))}
      </div>

      <div>
        {friendRequests.recieved.map(({ id, user, friend }) => (
          <p key={id}>
            {user.username} {"->"} {friend.username}
          </p>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 ">
        {pokemons.length === 0 ? (
          <div>loading...</div>
        ) : (
          pokemons.map(({ id, name, spriteUrl }) => (
            <div
              className="bg-slate-100 text-black rounded-lg flex flex-col p-1"
              key={id}
            >
              <h2 className="text-center text-2xl">{name}</h2>
              <img
                className={`${
                  !ownsPokemon(id) && "brightness-0"
                } [image-rendering:pixelated]`}
                src={spriteUrl}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserPage;
