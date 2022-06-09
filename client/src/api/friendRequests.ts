import { SERVER_BASE_URL } from "../config";

export const getFriendRequests = () =>
  fetch(`${SERVER_BASE_URL}/api/v1/friendRequests`, {
    credentials: "include",
  }).then((res) => res.json());

export const postFriendRequest = (friendId: number) =>
  fetch(`${SERVER_BASE_URL}/api/v1/friendRequests`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      friendId,
    }),
  }).then((res) => res.json());

export const deleteFriendRequest = (id: number) =>
  fetch(`${SERVER_BASE_URL}/api/v1/friendRequests`, {
    method: "DELETE",
    credentials: "include",
    body: JSON.stringify({
      friendRequestId: id,
    }),
  }).then((res) => res.json());
