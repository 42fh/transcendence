export function displayLogoutError(message) {
  const logoutButton = document.getElementById("logout-button");

  // Remove any existing error message
  const existingError = document.getElementById("logout-error");
  if (existingError) {
    existingError.remove();
  }

  // Create a new error message element
  const errorElement = document.createElement("p");
  errorElement.id = "logout-error";
  errorElement.style.color = "red";
  errorElement.style.marginTop = "10px";
  errorElement.textContent = message;

  // Insert the error message after the logout button
  logoutButton.insertAdjacentElement("afterend", errorElement);
}
