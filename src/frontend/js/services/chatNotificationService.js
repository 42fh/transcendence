export async function fetchNotifications() {
  const response = await fetch("/api/chat/notifications/");
  // console.log("notifications:      ", response);
  if (!response.ok) throw new Error("Failed to get notifications list");

  const data = await response.json();
  // console.log("Fetched notifications:", data);
  return data;
}
