export async function toggleBlockUser(username, isCurrentlyBlocked) {
  const method = isCurrentlyBlocked ? "DELETE" : "POST";
  const response = await fetch("/api/chat/blocked_user/", {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) throw new Error("Failed to toggle block status");
  return response.json();
}
