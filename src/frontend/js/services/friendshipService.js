import { CONFIG } from "../config/constants.js";

/**
 * Backend Friendship API Endpoints:
 *
 * Friend Requests:
 * GET    /api/users/friend-requests/       - List pending requests (sent/received)
 * POST   /api/users/friend-requests/       - Send new request {to_user_id: uuid}
 * DELETE /api/users/friend-requests/       - Withdraw/reject request {to_user_id: uuid, action: "withdraw|reject"}
 *
 * Friendships:
 * GET    /api/users/friends/<user_id>/    - List user's friends (with pagination & search)
 * POST   /api/users/friends/              - Accept friend request {from_user_id: uuid}
 * DELETE /api/users/friends/              - Remove friend {user_id: uuid}
 */

// Send a new friend request
export async function sendFriendRequest(toUserId) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/friend-requests/`, {
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
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/friends/`, {
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
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/friends/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_user_id: fromUserId }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: "NETWORK_ERROR", message: error.message };
  }
}

// Withdraw a friend request you sent
export async function withdrawFriendRequest(toUserId) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/friend-requests/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to_user_id: toUserId,
        from_user_id: null,
        request_type: "sent",
        action: "withdraw",
      }),
    });
    return await handleResponse(response);
  } catch (error) {
    return { success: false, error: "NETWORK_ERROR", message: error.message };
  }
}

// Reject a friend request you received
export async function rejectFriendRequest(fromUserId) {
  try {
    const response = await fetch(`${CONFIG.API_BASE_URL}/api/users/friend-requests/`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from_user_id: fromUserId,
        to_user_id: null,
        request_type: "received",
        action: "reject",
      }),
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
