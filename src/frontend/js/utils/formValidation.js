export const VALIDATION_RULES = {
  username: {
    pattern: /^[a-zA-Z0-9_-s]{3,20}$/,
    message: "Username must be 3-20 characters and can contain letters, numbers, underscore, and hyphen",
  },
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

export function setupFormValidation(form, validationRules) {
  form.querySelectorAll("input, textarea").forEach((input) => {
    // Add HTML5 validation attributes based on rules
    const rule = VALIDATION_RULES[input.name];
    if (rule) {
      if (rule.required) input.required = true;
      // Don't override existing pattern attributes from HTML
      if (rule.pattern && !input.hasAttribute("pattern")) {
        input.pattern = rule.pattern.source;
      }
      if (rule.maxLength) input.maxLength = rule.maxLength;
      // Add title attribute for validation message if not already set
      if (rule.message && !input.hasAttribute("title")) {
        input.title = rule.message;
      }
    }

    // Add blur event for custom validation
    input.addEventListener("blur", () => {
      const error = validateFormField(input);
      updateFieldError(input, error);
    });

    // Add input event to clear errors while typing
    input.addEventListener("input", () => {
      updateFieldError(input, null);
    });
  });
}

export function validateFormField(input) {
  if (!input.value) return null; // Allow empty fields unless required

  // First check HTML5 validation
  const isHTML5Valid = input.checkValidity();
  if (!isHTML5Valid) {
    return input.validationMessage;
  }

  // Then check custom validation rules
  const rule = VALIDATION_RULES[input.name];
  if (!rule) return null;

  if (rule.pattern && !rule.pattern.test(input.value)) {
    return rule.message;
  }

  if (rule.maxLength && input.value.length > rule.maxLength) {
    return rule.message;
  }

  return null;
}

export function updateFieldError(input, error) {
  const errorTemplate = document.getElementById("form-error-template");
  const existingError = input.parentElement.querySelector(".form-error");

  if (error) {
    if (!existingError) {
      const errorNode = document.importNode(errorTemplate.content, true);
      errorNode.querySelector(".form-error__message").textContent = error;
      input.parentElement.appendChild(errorNode);
    } else {
      existingError.querySelector(".form-error__message").textContent = error;
    }
    input.classList.add("profile-edit__input--error");
  } else {
    if (existingError) existingError.remove();
    input.classList.remove("profile-edit__input--error");
  }
}
