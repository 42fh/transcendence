# Form Validation Rules

## Username Validation

- **Pattern**: `^[a-zA-Z0-9_-]{3,20}$`
- **Max Length**: 20 characters
- **Regex Breakdown**:
  - `^`: Start of string
  - `[a-zA-Z0-9_-]`: Matches:
    - `a-z`: Any lowercase letter
    - `A-Z`: Any uppercase letter
    - `0-9`: Any number
    - `_`: Underscore
    - `-`: Hyphen
  - `{3,20}`: Between 3 and 20 characters
  - `$`: End of string
- **Example (Valid)**: `user123`, `john_doe`, `user-name`
- **Example (Invalid)**: `ab`, `user!name`, `toolongusernameexample123`

## Email Validation

- **Pattern**: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- **Max Length**: 254 characters
- **Regex Breakdown**:
  - `^`: Start of string
  - `[^\s@]+`: One or more characters that are not:
    - `\s`: Whitespace
    - `@`: @ symbol
  - `@`: Literal @ symbol
  - `[^\s@]+`: Domain name (same rules as above)
  - `\.`: Literal dot
  - `[^\s@]+`: Top-level domain
  - `$`: End of string
- **Example (Valid)**: `user@example.com`, `name.surname@domain.co.uk`
- **Example (Invalid)**: `user@.com`, `@domain.com`, `user@domain`

## Phone Validation

- **Pattern**: `^\+?[\d\s-]{10,15}$`
- **Max Length**: 15 characters
- **Regex Breakdown**:
  - `^`: Start of string
  - `\+?`: Optional plus sign
  - `[\d\s-]`: Matches:
    - `\d`: Any digit
    - `\s`: Whitespace
    - `-`: Hyphen
  - `{10,15}`: Between 10 and 15 characters
  - `$`: End of string
- **Example (Valid)**: `+1-234-567-8900`, `1234567890`
- **Example (Invalid)**: `123-456`, `+abcd`, `12345678901234567`

## Name Validation

- **Pattern**: `^[a-zA-Z\s-]{2,50}$`
- **Max Length**: 50 characters
- **Regex Breakdown**:
  - `^`: Start of string
  - `[a-zA-Z\s-]`: Matches:
    - `a-z`: Any lowercase letter
    - `A-Z`: Any uppercase letter
    - `\s`: Whitespace
    - `-`: Hyphen
  - `{2,50}`: Between 2 and 50 characters
  - `$`: End of string
- **Example (Valid)**: `John`, `Mary Jane`, `Jean-Baptiste Emmanuel`
- **Example (Invalid)**: `J`, `123John`, `This-name-is-way-too-long-and-exceeds-fifty-characters`

## Bio Validation

- **Maximum Length**: 500 characters
- **Description**: Free-form text field with length restriction only
- **Validation Rules**:
  - Allows any characters
  - Trims whitespace at start/end
  - Must not exceed 500 characters
- **Example (Valid)**: Any text under 500 characters
- **Example (Invalid)**: Text exceeding 500 characters

### Notes:

- All fields trim whitespace before validation
- Empty fields are allowed unless marked as required
- HTML5 validation attributes are automatically added to form fields
- Client-side validation is complemented by server-side validation
- Maximum lengths are chosen based on practical usage and industry standards

# Form Validation Rules

## Username Validation

- **Pattern**: `^[a-zA-Z0-9_-]{3,20}$`
- **Max Length**: 20 characters
- **Database Constraint**: CharField(max_length=150) [Django default]
- **Our Chosen Limit**: 20 characters
- **Motivation**: While Django allows 150 characters, we restrict to 20 for:
  - Better UI/UX (usernames display well in menus and chat)
  - Industry standard (GitHub, Twitter use similar limits)
  - Prevents abuse/spam with extremely long usernames

## Email Validation

- **Pattern**: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- **Max Length**: 254 characters
- **Database Constraint**: EmailField(max_length=254)
- **Motivation**: RFC 5321 standard maximum length for email addresses
  - Local part: max 64 characters
  - Domain part: max 255 characters
  - Total with @ symbol: 254 characters

## Phone Validation

- **Pattern**: `^\+?[\d\s-]{10,15}$`
- **Max Length**: 15 characters
- **Database Constraint**: CharField(max_length=20)
- **Our Chosen Limit**: 15 characters
- **Motivation**: Based on E.164 international standard:
  - Country code: 1-3 digits
  - National number: 7-12 digits
  - Plus symbol: 1 character
  - Extra space for formatting characters (-, space)

## Name Validation

- **Pattern**: `^[a-zA-Z\s-]{2,50}$`
- **Max Length**: 50 characters
- **Database Constraint**: CharField(max_length=150) [Django default]
- **Our Chosen Limit**: 50 characters
- **Motivation**:
  - Accommodates most international names
  - Supports compound names (e.g., Jean-Baptiste Emmanuel)
  - Balances between usability and database efficiency
  - Most human names are under 50 characters

## Bio Validation

- **Maximum Length**: 500 characters
- **Database Constraint**: TextField(null=True, blank=True)
- **Our Chosen Limit**: 500 characters
- **Motivation**:
  - Long enough for meaningful self-description
  - Short enough to maintain readability
  - Common limit in social platforms
  - Prevents profile spam/abuse
