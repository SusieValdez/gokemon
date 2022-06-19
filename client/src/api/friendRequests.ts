import { z } from "zod";
import { SERVER_BASE_URL } from "../config";
import { FriendRequest } from "../models";

export const FriendRequests = z.object({
  sent: z.array(FriendRequest),
  received: z.array(FriendRequest),
});
export type FriendRequests = z.infer<typeof FriendRequests>;

export const getFriendRequests = async (): Promise<FriendRequests> =>
  fetch(`${SERVER_BASE_URL}/api/v1/friendRequests`, {
    credentials: "include",
  })
    .then((res) => res.json())
    .then((json) => FriendRequests.parse(json));

export const postFriendRequest = async (friendId: number): Promise<string> =>
  fetch(`${SERVER_BASE_URL}/api/v1/friendRequests`, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify({
      friendId,
    }),
  })
    .then((res) => res.json())
    .then((json) => z.string().parse(json));

export const deleteFriendRequest = async (id: number): Promise<string> =>
  fetch(`${SERVER_BASE_URL}/api/v1/friendRequests`, {
    method: "DELETE",
    credentials: "include",
    body: JSON.stringify({
      friendRequestId: id,
    }),
  })
    .then((res) => res.json())
    .then((json) => z.string().parse(json));
