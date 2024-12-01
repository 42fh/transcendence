import CONFIG from "../config.js";

/**
 * Backend Friendship API Endpoints:
 *
 * Friend Requests:
 * GET    /api/friend-requests/              - List pending requests (sent/received)
 * POST   /api/friend-requests/              - Send new request {to_user_id: uuid}
 * DELETE /api/friend-requests/              - Withdraw/reject request {to_user_id: uuid, action: "withdraw|reject"}
 *
 * Friendships:
 * GET    /api/friends/<user_id>/           - List user's friends (with pagination & search)
 * POST   /api/friends/                     - Accept friend request {from_user_id: uuid}
 * DELETE /api/friends/                     - Remove friend {user_id: uuid}
 */

// Send a new friend request
export async function sendFriendRequest(toUserId) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/friend-requests/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_user_id: toUserId }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: "NETWORK_ERROR", message: error.message };
  }
}

// Remove an existing friend
export async function removeFriend(userId) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/friends/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: "NETWORK_ERROR", message: error.message };
  }
}

// Accept a friend request
export async function acceptFriendRequest(fromUserId) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/friends/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_user_id: fromUserId }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: "NETWORK_ERROR", message: error.message };
  }
}

// Withdraw sent request or reject received request
export async function handleFriendRequest(userId, action) {
  try {
    const payload =
      action === "withdraw" ? { to_user_id: userId, action: "withdraw" } : { from_user_id: userId, action: "reject" };

    const response = await fetch(`${CONFIG.API_BASE_URL}/api/friend-requests/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: "NETWORK_ERROR", message: error.message };
  }
}

async function handleResponse(response) {
  const data = await response.json();
  return {
    success: response.ok,
    status: response.status,
    data: data,
  };
}
