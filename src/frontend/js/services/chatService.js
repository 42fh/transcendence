export async function fetchConversationList() {
  const response = await fetch("/api/chat/users/");
  if (!response.ok) throw new Error("Failed to get user list");
  return response.json();
}

export async function toggleBlockUser(username, isCurrentlyBlocked, csrfToken) {
  const method = isCurrentlyBlocked ? "DELETE" : "POST";
  const response = await fetch("/api/chat/blocked_user/", {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) throw new Error("Failed to toggle block status");
  return response.json();
}
