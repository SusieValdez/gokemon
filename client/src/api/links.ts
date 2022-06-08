import { SERVER_BASE_URL } from "../config";

export const DISCORD_REDIRECT_URI = `${SERVER_BASE_URL}/api/v1/auth/discord/redirect`;

export const DISCORD_LOGIN_URL = `https://discord.com/api/oauth2/authorize?client_id=982805739015901244&redirect_uri=${encodeURI(
  DISCORD_REDIRECT_URI
)}&response_type=code&scope=identify`;

export const LOGOUT_URL = `${SERVER_BASE_URL}/api/v1/auth/logout`;

export const userPageUrl = (username: string) => `/${username}`;
