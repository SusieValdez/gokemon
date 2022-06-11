import { useState, useEffect } from "react";
import {
  deleteFriendRequest,
  postFriendRequest,
} from "../../api/friendRequests";
import { userPageUrl } from "../../api/links";
import { getPokemons } from "../../api/pokemon";
import { deleteFriendship } from "../../api/users";
import { FriendRequest, Pokemon, User } from "../../models";

type UserProps = {
  loggedInUser?: User;
  sentFriendRequests: FriendRequest[];
  user: User;
};

function UserPage({ user, loggedInUser, sentFriendRequests }: UserProps) {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const ownedPokemonMap = (user.ownedPokemon ?? []).reduce(
    (acc, pokemon) => ({
      ...acc,
      [pokemon.id]: pokemon,
    }),
    {} as Record<number, Pokemon>
  );
  const ownsPokemon = (id: number) => ownedPokemonMap[id] !== undefined;

  useEffect(() => {
    getPokemons().then((pokemons) => setPokemons(pokemons));
  }, []);

  const onClickSendFriendRequest = () => {
    postFriendRequest(user.id).then(() => window.location.reload());
  };

  const onClickCancelFriendRequest = (id: number) => {
    deleteFriendRequest(id).then(() => window.location.reload());
  };

  const onClickRemoveFriend = (friendId: number) => {
    deleteFriendship(friendId).then(() => window.location.reload());
  };

  const canSeeFriendRequestButton = user.id !== loggedInUser?.id;

  const friendRequestFromLoggedInUser = sentFriendRequests.find(
    ({ user: { id } }) => id === loggedInUser?.id
  );

  const friend = loggedInUser?.friends.find(({ id }) => id === user.id);

  return (
    <div>
      <div className="flex justify-between mb-3">
        <div>
          <img
            src={user.profilePictureUrl}
            className="w-16 h-16 rounded-full inline-block mr-5"
          />
          <h2 className="text-3xl inline-block">
            {user.username}'s Pokemon - ({user.ownedPokemon.length} /{" "}
            {pokemons.length})
          </h2>
        </div>
        {canSeeFriendRequestButton &&
          (friend ? (
            <button
              className="bg-red-500 p-3 rounded-md text-lg hover:bg-red-600 active:brightness-90"
              onClick={() => onClickRemoveFriend(friend.id)}
            >
              Remove Friend
            </button>
          ) : friendRequestFromLoggedInUser ? (
            <button
              className="bg-red-500 p-3 rounded-md text-lg hover:bg-red-600 active:brightness-90"
              onClick={() =>
                onClickCancelFriendRequest(friendRequestFromLoggedInUser.id)
              }
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
