import { useState, useEffect } from "react";

const MAX_POKEMON_ID = 151;

type Pokemon = {
  id: number;
  name: string;
  spriteUrl: string;
};

function App() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);

  useEffect(() => {
    const ids = [];
    for (let i = 1; i <= MAX_POKEMON_ID; i++) {
      ids.push(i);
    }
    Promise.all(
      ids.map((id) =>
        fetch(`http://localhost:8080/api/v1/pokemon/${id}`).then((res) =>
          res.json()
        )
      )
    ).then((pokemons) => setPokemons(pokemons));
  }, []);

  return (
    <div className="h-auto bg-gradient-to-br from-blue-500 via-sky-500 to-cyan-500">
      <h1 className="text-5xl text-red-800">Gokemon</h1>
      <div className="p-4 w-2/3 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {pokemons.map(({ id, name, spriteUrl }) => (
            <div className="bg-slate-100 rounded-lg flex flex-col p-1" key={id}>
              <h2 className="text-center text-2xl">{name}</h2>
              <img className="brightness-0" src={spriteUrl} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
