import { SERVER_BASE_URL } from "../config";

export const getUser = (userId: number | string) =>
  fetch(`${SERVER_BASE_URL}/api/v1/user/${userId}`, {
    credentials: "include",
  }).then((res) => res.json());

export const postFriendship = (friendRequestId: number) =>
  fetch(`${SERVER_BASE_URL}/api/v1/friendships`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      friendRequestId,
    }),
  }).then((res) => res.json());

export const deleteFriendship = (friendId: number) =>
  fetch(`${SERVER_BASE_URL}/api/v1/friendships`, {
    method: "DELETE",
    credentials: "include",
    body: JSON.stringify({
      friendId,
    }),
  }).then((res) => res.json());
