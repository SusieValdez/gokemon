import { useState, useEffect } from "react";

type Pokemon = {
  id: number;
  name: string;
  spriteUrl: string;
};

type User = {
  id: number;
  username: string;
  ownedPokemon: Pokemon[];
  friends: User[];
};

function App() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [user, setUser] = useState<User>();
  const ownedPokemonMap = (user?.ownedPokemon ?? []).reduce(
    (acc, pokemon) => ({
      ...acc,
      [pokemon.id]: pokemon,
    }),
    {} as Record<number, Pokemon>
  );
  const ownsPokemon = (id: number) => ownedPokemonMap[id] !== undefined;

  useEffect(() => {
    fetch(`http://localhost:8080/api/v1/pokemon`)
      .then((res) => res.json())
      .then((pokemons) => setPokemons(pokemons));
  }, []);

  useEffect(() => {
    const splitUrl = location.href.split("/");
    const userId = splitUrl[splitUrl.length - 1];
    fetch(`http://localhost:8080/api/v1/user/${userId}`)
      .then((res) => res.json())
      .then((user) => setUser(user));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500 text-white">
      <div className="p-4 w-2/3 mx-auto">
        <h1 className="text-5xl  mb-3">
          Gokemon - ({user?.ownedPokemon.length} / {pokemons.length})
        </h1>
        {user && <h2 className="text-3xl mb-3">{user.username}'s Pokemon</h2>}
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
    </div>
  );
}

export default App;
