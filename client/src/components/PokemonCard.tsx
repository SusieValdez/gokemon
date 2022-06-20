import { spriteUrl } from "../api/pokemon";
import { OwnedPokemon } from "../models";

const pokemonTypeColors: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

type PokemonCardProps = {
  pokemon: OwnedPokemon;
  onClick?: () => void;
  imgClassName?: string;
};

const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  onClick,
  imgClassName,
  children,
}) => {
  const {
    pokemon: { id, name, forms },
    formIndex,
    isShiny,
  } = pokemon;
  const form = forms[formIndex];
  return (
    <div
      className={`w-full text-black rounded-lg flex flex-col py-2 px-4 cursor-pointer outline hover:outline-2 outline-0 outline-black`}
      style={{
        background:
          form.types.length === 2
            ? `linear-gradient(to bottom right, ${
                pokemonTypeColors[form.types[0].name]
              } 50%, ${pokemonTypeColors[form.types[1].name]} 50%)`
            : pokemonTypeColors[form.types[0].name],
      }}
      key={id}
      onClick={onClick}
    >
      <h2 className="text-center text-sm md:text-lg font-bold">
        {isShiny && "Shiny "}
        {form.name}
      </h2>
      <div>
        <img
          className={`[image-rendering:pixelated] w-full ${imgClassName ?? ""}`}
          src={spriteUrl(pokemon)}
        />
      </div>
      {children}
      <span className="text-center text-sm font-bold">{id}</span>
    </div>
  );
};

export default PokemonCard;
