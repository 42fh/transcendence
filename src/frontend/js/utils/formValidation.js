export const VALIDATION_RULES = {
  email: {
    // Regex breakdown for email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    // ^ - start of string
    // [^\s@]+ - one or more characters that are NOT whitespace or @
    // @ - literal @ symbol
    // [^\s@]+ - one or more characters that are NOT whitespace or @
    // \. - literal dot (escaped with \)
    // [^\s@]+ - one or more characters that are NOT whitespace or @
    // $ - end of string
    // Examples valid: john.doe@example.com, jane_doe123@sub.domain.com
    // Examples invalid: john@.com, @domain.com, john@domain
    // Requires: something@something.something
    // Prevents: spaces, multiple @ signs, missing domain
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Please enter a valid email address",
  },
  phone: {
    // Regex breakdown for phone: /^\+?[\d\s-]{10,}$/
    // ^ - start of string
    // \+? - optional plus sign
    // [\d\s-] - any digit, whitespace, or hyphen
    // {10,} - at least 10 of the previous characters
    // $ - end of string
    // Examples valid: +1-234-567-8900, 1234567890, 123 456 7890
    // Examples invalid: 123-456, +abcd, 123
    // Allows: +1234567890, 123-456-7890, 123 456 7890
    // Requires: At least 10 digits
    // Optional: +, spaces, hyphens
    pattern: /^\+?[\d\s-]{10,}$/,
    message: "Please enter a valid phone number",
  },
  name: {
    // Regex breakdown for name: /^[a-zA-Z\s-]{2,}$/
    // ^ - start of string
    // [a-zA-Z\s-] - any letter (upper or lower case), whitespace, or hyphen
    // {2,} - at least 2 of the previous characters
    // $ - end of string
    // Examples valid: John, Mary Jane, Jean-Pierre
    // Examples invalid: J, 123John, John!
    // Allows: letters, spaces, hyphens
    // Requires: at least 2 characters
    // Prevents: numbers, special characters
    pattern: /^[a-zA-Z\s-]{2,}$/,
    message: "Name should contain at least 2 letters",
  },
  bio: {
    maxLength: 500,
    message: "Bio cannot exceed 500 characters",
  },
};

export function validateField(fieldName, value) {
  if (!value) return null; // Allow empty fields

  const rule = VALIDATION_RULES[fieldName];
  if (!rule) return null;

  if (rule.pattern && !rule.pattern.test(value)) {
    return rule.message;
  }

  if (rule.maxLength && value.length > rule.maxLength) {
    return rule.message;
  }

  return null;
}
