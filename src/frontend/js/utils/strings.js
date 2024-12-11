export function applyUsernameTruncation(element, username, maxLength = 25) {
  // Mind: the div must have the class 'username'
  element.classList.add("username-truncate");
  element.title = username;
  element.textContent = truncateUsername(username, maxLength);
}

function truncateUsername(username, maxLength = 25) {
  return username.length > maxLength ? username.substring(0, maxLength) + "..." : username;
}
