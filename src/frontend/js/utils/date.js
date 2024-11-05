/**
 * Formats a date string according to specified options
 * @param {string} dateString - The date string to format
 * @param {Object} options - Formatting options
 * @param {boolean} options.showYear - Whether to show the year (default: false)
 * @param {boolean} options.monthFirst - Whether to show month before day (default: false)
 * @param {boolean} options.showTime - Whether to show time (default: true)
 * @returns {string} Formatted date string
 */

// Helper functions for date formatting
export function formatDate(dateString, options = {}) {
  const { showYear = false, monthFirst = false, showTime = true } = options;

  const date = new Date(dateString);

  if (isNaN(date)) {
    return "Invalid Date";
  }

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  let formattedDate;
  if (monthFirst) {
    formattedDate = showYear ? `${month}-${day}-${year}` : `${month}-${day}`;
  } else {
    formattedDate = showYear ? `${day}-${month}-${year}` : `${day}-${month}`;
  }
  if (showTime) {
    formattedDate += ` ${hours}:${minutes}`;
  }

  return formattedDate;
}
