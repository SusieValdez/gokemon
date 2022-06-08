import { DISCORD_LOGIN_URL } from "../../api/links";

function HomePage() {
  return (
    <div className="bg-slate-50 w-full h-auto lg:w-1/3  m-auto rounded-md p-4 flex flex-col items-center">
      <h2 className="text-dark text-2xl pb-4">Continue with Discord</h2>
      <a
        href={DISCORD_LOGIN_URL}
        className="bg-blurple p-3 rounded-md text-lg hover:bg-dark-blurple active:brightness-90"
      >
        Login with Discord
      </a>
    </div>
  );
}

export default HomePage;
