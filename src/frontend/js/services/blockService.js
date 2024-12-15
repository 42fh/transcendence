export async function toggleBlockUser(username, isCurrentlyBlocked) {
  console.log("toggleBlockUser");
  console.log("toggleBlockUser", username, isCurrentlyBlocked);
  const method = isCurrentlyBlocked ? "DELETE" : "POST";
  console.log(isCurrentlyBlocked ? "Unblocking" : "Blocking", username);
  console.log("method", method);
  const response = await fetch("/api/chat/blocked_user/", {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });
  console.log("response", response);
  if (!response.ok) throw new Error("Failed to toggle block status");
  return response.json();
}


export async function isUserBlockedByCurrentUser(username) {
  try {
    const response = await fetch("/api/chat/blocked_user/", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch blocked users");
    }

    const data = await response.json();
    console.log("Data from isUserBlockedByCurrentUser", data);
    const blockedUsers = new Set(data.blocked_users);
    console.log("blockedUsers", blockedUsers);
    const isBlocked = blockedUsers.has(username);
    // console.log("isBlocked", isBlocked);
    return isBlocked;

  } catch (error) {
    console.error("Error checking blocked status:", error);
    return false;
  }
}
