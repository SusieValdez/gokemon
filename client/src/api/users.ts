import { SERVER_BASE_URL } from "../config";

export const getUser = (userId: number | string) =>
  fetch(`${SERVER_BASE_URL}/api/v1/user/${userId}`, {
    credentials: "include",
  }).then((res) => res.json());
