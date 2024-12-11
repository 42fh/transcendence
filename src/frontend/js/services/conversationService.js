export async function fetchConversationList() {
  const response = await fetch("/api/chat/");
  if (!response.ok) throw new Error("Failed to get conversation list");

  const data = await response.json();
  return data;
}
