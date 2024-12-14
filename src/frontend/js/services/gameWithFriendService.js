/**
 * Backend Friendship API Endpoints:
 *
 * Friend Requests:
 * GET    /api/users/friend-requests/       - List pending requests (sent/received)
 * POST   /api/game/invitation/             - Send new request {to_user_id: uuid}
 * DELETE /api/users/friend-requests/       - Withdraw/reject request {to_user_id: uuid, action: "withdraw|reject"}
 *
 * Friendships:
 * GET    /api/users/friends/<user_id>/    - List user's friends (with pagination & search)
 * POST   /api/users/friends/              - Accept friend request {from_user_id: uuid}
 * DELETE /api/users/friends/              - Remove friend {user_id: uuid}
 */

// Invite a friend to play a game
export async function inviteFriend(friendUuid) {
  // const currentUserId = localStorage.getItem(LOCAL_STORAGE_KEYS.USER_ID);
  const response = await fetch("/api/game/invitation/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // body: JSON.stringify({ currentUserId, friendId }),
    body: JSON.stringify({ to_user_id: friendUuid }), 
  });

  if (!response.ok) throw new Error("API request to invite friend failed");
  return response.json();
}
