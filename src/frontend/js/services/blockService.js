export async function fetchConversationList() {
  const response = await fetch("/api/chat/");
  if (!response.ok) throw new Error("Failed to get conversation list");

  const data = await response.json();
  return data;
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
