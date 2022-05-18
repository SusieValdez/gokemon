import { useState, useEffect } from "react";

type Pokemon = {
  id: number;
  name: string;
  spriteUrl: string;
};

function App() {
  const [pokemons, setPokemons] = useState<Pokemon[]>([]);
  const [startPokemonId, setStartPokemonId] = useState("1");
  const [endPokemonId, setEndPokemonId] = useState("1");

  useEffect(() => {
    const ids = [];
    for (let i = parseInt(startPokemonId); i <= parseInt(endPokemonId); i++) {
      ids.push(i);
    }
    Promise.all(
      ids.map((id) =>
        fetch(`http://localhost:8080/api/v1/pokemon/${id}`).then((res) =>
          res.json()
        )
      )
    ).then((pokemons) => setPokemons(pokemons));
  }, [startPokemonId, endPokemonId]);

  const onChangeStartPokemonId: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    setStartPokemonId(e.target.value);
  };

  const onChangeEndPokemonId: React.ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    setEndPokemonId(e.target.value);
  };

  return (
    <div>
      <h1>Gokemon</h1>
      <input
        type="number"
        value={startPokemonId}
        onChange={onChangeStartPokemonId}
        min="1"
        max="151"
      />
      <input
        type="number"
        value={endPokemonId}
        onChange={onChangeEndPokemonId}
        min="1"
        max="151"
      />
      {pokemons.map(({ name, spriteUrl }) => (
        <div>
          <h2>{name}</h2>
          <img src={spriteUrl} />
        </div>
      ))}
    </div>
  );
}

export default App;
