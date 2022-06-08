import { useState, useEffect } from "react";
import { Pokemon, User } from "../../models";

type UserProps = {
  user: User;
};

function UserPage({ user }: UserProps) {
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
    fetch(`http://localhost:8080/api/v1/pokemon`)
      .then((res) => res.json())
      .then((pokemons) => setPokemons(pokemons));
  }, []);

  return (
    <div>
      <h2 className="text-3xl mb-3">
        {user.username}'s Pokemon - ({user.ownedPokemon.length} /{" "}
        {pokemons.length})
      </h2>
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
