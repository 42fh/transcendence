from django.core.validators import RegexValidator, EmailValidator

# Username validation
USERNAME_VALIDATOR = RegexValidator(
    regex=r"^[a-zA-Z0-9_-]{3,20}$",
    message="Username must be 3-20 characters long and contain only letters, numbers, underscores, and hyphens",
)

# Name validation: for first and last name
NAME_VALIDATOR = RegexValidator(
    regex=r"^[a-zA-Z\s-]{2,50}$", message="Name must be 2-50 characters and contain only letters, spaces, and hyphens"
)

# Phone validation
PHONE_VALIDATOR = RegexValidator(
    regex=r"^\+?[\d\s-]{10,15}$",
    message="Phone number must be 10-15 digits and may include spaces, hyphens, and a plus symbol",
)

# Email validator (Django's built-in)
EMAIL_VALIDATOR = EmailValidator()

# Field length limits
FIELD_MAX_LENGTHS = {
    "username": 20,
    "first_name": 50,
    "last_name": 50,
    "email": 254,
    "telephone_number": 15,
    "bio": 500,
    "pronoun": 20,
}


def validate_field(field_name, value):
    """
    Centralized field validation function
    Returns cleaned value if valid, raises ValidationError if not
    """
    if value is None or value.strip() == "":
        return None  # Allow clearing fields

    value = value.strip()

    # Check max length
    max_length = FIELD_MAX_LENGTHS.get(field_name)
    if max_length and len(value) > max_length:
        raise ValidationError(f"{field_name.replace('_', ' ').title()} cannot exceed {max_length} characters")

    # Field-specific validation
    if field_name == "username":
        USERNAME_VALIDATOR(value)
    elif field_name in ["first_name", "last_name"]:
        NAME_VALIDATOR(value)
    elif field_name == "email":
        EMAIL_VALIDATOR(value)
    elif field_name == "telephone_number":
        PHONE_VALIDATOR(value)

    return value
