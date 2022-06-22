import { z } from "zod";
import { SERVER_BASE_URL } from "../config";
import { User } from "../models";

export const UserSession = z.object({
  loggedInUser: z.nullable(User),
  user: z.nullable(User),
});
export type UserSession = z.infer<typeof UserSession>;

export const getUser = (userId: number | string) =>
  fetch(`${SERVER_BASE_URL}/api/v1/user/${userId}`, {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((json) => UserSession.parse(json));

export const postFriendship = (friendRequestId: number) =>
  fetch(`${SERVER_BASE_URL}/api/v1/friendships`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      friendRequestId,
    }),
  })
    .then((res) => res.json())
    .then((json) => z.string().parse(json));

export const deleteFriendship = (friendId: number) =>
  fetch(`${SERVER_BASE_URL}/api/v1/friendships`, {
    method: "DELETE",
    credentials: "include",
    body: JSON.stringify({
      friendId,
    }),
  })
    .then((res) => res.json())
    .then((json) => z.string().parse(json));

export const acceptTrade = (tradeRequestId: number) =>
  fetch(`${SERVER_BASE_URL}/api/v1/acceptTrade`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      tradeRequestId,
    }),
  })
    .then((res) => res.json())
    .then((json) => z.string().parse(json));

export const updatePreferredForm = (pokemonId: number, formIndex: number) =>
  fetch(`${SERVER_BASE_URL}/api/v1/user/preferredForm`, {
    method: "PUT",
    credentials: "include",
    body: JSON.stringify({
      pokemonId,
      formIndex,
    }),
  })
    .then((res) => res.json())
    .then((json) => z.string().parse(json));
