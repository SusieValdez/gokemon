function HomePage() {
  return (
    <div className="bg-slate-50 w-full h-auto lg:w-1/3  m-auto rounded-md p-4 flex flex-col items-center">
      <h2 className="text-dark text-2xl pb-4">Continue with Discord</h2>
      <a
        href="https://discord.com/api/oauth2/authorize?client_id=982805739015901244&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fapi%2Fv1%2Fauth%2Fdiscord%2Fredirect&response_type=code&scope=identify"
        className="bg-blurple p-3 rounded-md text-lg hover:bg-dark-blurple active:brightness-90"
      >
        Login with Discord
      </a>
    </div>
  );
}

export default HomePage;
