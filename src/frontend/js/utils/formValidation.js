export const VALIDATION_RULES = {
  username: {
    // pattern: /^[a-zA-Z0-9_-]{3,20}$/,
    pattern: /^[a-zA-Z0-9_\-]{3,20}$/,
    maxLength: 20,
    message: "Username must be 3-20 characters and can contain letters, numbers, underscore, and hyphen",
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 254,
    message: "Please enter a valid email address",
  },
  telephone_number: {
    pattern: /^\+?[0-9]{10,15}$/, // Updated to include max length in pattern
    maxLength: 15,
    message: "Please enter a valid phone number (10-15 digits, optional + prefix)",
  },
  first_name: {
    // Added specific rule for first name
    pattern: /^[a-zA-Z \-]{2,50}$/, // Only allow digits with leading +
    maxLength: 50,
    message: "First name should be 2-50 characters and can contain letters, spaces, and hyphens",
  },
  last_name: {
    // Added specific rule for last name
    pattern: /^[a-zA-Z \-]{2,50}$/, // Updated to include max length in pattern
    maxLength: 50,
    message: "Last name should be 2-50 characters and can contain letters, spaces, and hyphens",
  },
  bio: {
    maxLength: 500,
    message: "Bio cannot exceed 500 characters",
  },
};

export function setupFormValidation(form) {
  form.querySelectorAll("input, textarea").forEach((input) => {
    // Add HTML5 validation attributes based on rules
    const rule = VALIDATION_RULES[input.name];
    console.log(`Setting up validation for ${input.name}:`, rule);
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

  // Check validation rules
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

export function showFieldError(input, error) {
  const errorTemplate = document.getElementById("form-error-template");
  const existingError = input.parentElement.querySelector(".form-error");

  if (!existingError) {
    const errorNode = document.importNode(errorTemplate.content, true);
    errorNode.querySelector(".form-error__message").textContent = error;
    input.parentElement.appendChild(errorNode);
  } else {
    existingError.querySelector(".form-error__message").textContent = error;
  }
  input.classList.add("form-input--error");
}

export function clearFieldError(input) {
  const existingError = input.parentElement.querySelector(".form-error");
  if (existingError) existingError.remove();
  input.classList.remove("form-input--error");
}

export function updateFieldError(input, error) {
  if (error) {
    showFieldError(input, error);
  } else {
    clearFieldError(input);
  }
}
