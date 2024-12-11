export async function inviteFriend(friendId) {
  const currentUserId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  const response = await fetch("/api/game/invitation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currentUserId, friendId }),
  });

  if (!response.ok) throw new Error("API request to invite friend failed");
  return response.json();
}
