# API Testing

These tests are end-to-end API tests that run independently from Django's test framework. They are placed outside the Django apps to test the API endpoints as an external client would, ensuring the API behaves correctly from a client's perspective.

## Setting up Test Environment

1. Create and activate virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # Unix/MacOS
# or
.\venv\Scripts\activate  # Windows
```

2. Install requirements:

```bash
pip install -r requirements.txt
```

3. Run tests:

```bash
# Using Python's unittest (recommended for these external tests)
python test_user_api.py  # Will run with detailed output

# Or using pytest if preferred
python -m pytest test_user_api.py -v  # -v for verbose output
```

The difference between these two approaches:

- `python test_user_api.py`:

  - Uses Python's built-in unittest framework directly
  - Shows test progress and results with:
    - Test method names
    - Success/failure status for each test
    - Detailed error messages if tests fail
  - Simpler, more straightforward execution
  - Runs the tests exactly as written, with minimal extra tooling
  - Suitable for these end-to-end tests as they don't require Django's test features

- `python -m pytest test_user_api.py`:
  - Uses pytest as a test runner
  - Provides additional features like:
    - More detailed test output
    - Better error reporting
    - Test discovery in subdirectories
    - Fixture support
  - Might be overkill for these simple API tests
  - Could introduce unnecessary complexity

For these specific end-to-end tests, running with `python test_user_api.py` is recommended as they are designed to be simple, independent tests that don't require pytest's additional features.

Note: Make sure the Django development server is running (`make up-dev`) before running the tests.

## User Endpoints Being Tested

### List Users

Tests the endpoint that returns a paginated list of users with basic information:

```bash
curl http://localhost:8000/api/users/
```

### Get User Details

Tests retrieving detailed information for a specific user:

```bash
# Replace USER_UUID with the actual UUID of the user
curl http://localhost:8000/api/users/USER_UUID/
```

## Expected Data

The test database should contain these users (UUIDs will be generated):

- dev (development user)

  - email: dev@example.com
  - password: dev
  - wins: 5, losses: 2

- ThePrimeagen

  - email: prime@vim.dev
  - wins: 15, losses: 5
  - Bio: If you're not using Vim, you're not living. Also, I love Rust.

- LexFridman

  - email: lex@mit.edu
  - wins: 8, losses: 8
  - Bio: Love is the answer. Also, let's talk about consciousness and AI.

- ElonMusk

  - email: elon@x.com
  - wins: 42, losses: 0
  - Bio: Let's make Pong multiplanetary! 🚀

- CheGuevara
  - email: che@revolution.cu
  - wins: 20, losses: 2
  - Bio: Hasta la victoria siempre! Even in Pong.

Each user has:

- Profile information
- Game history
- Win/loss statistics
- Avatar image in media/avatars/tests/

# Notes

## Debugging Django Session Issues: `SESSION_COOKIE_SECURE`

### Issue:

When testing or developing locally, Django may fail to send the `sessionid` cookie to the client. This can result in authentication issues, as the client is unable to identify itself to the server in subsequent requests.

### Cause:

The problem is often caused by the following setting in `settings.py`:

```python
SESSION_COOKIE_SECURE = True
```

This setting ensures that the session cookie (`sessionid`) is only sent over secure HTTPS connections. In a local development environment using HTTP (e.g., `http://127.0.0.1:8000`), the cookie will not be sent.

### Symptoms:

1. The server fails to include a `Set-Cookie` header in responses after user login or signup.
2. The client (e.g., `requests.Session`) does not store the session cookie.
3. Subsequent requests to authenticated endpoints return `401 Unauthorized`.

### Solution:

For local development, set `SESSION_COOKIE_SECURE` to `False` in `settings.py`:

```python
SESSION_COOKIE_SECURE = False
```

This allows the session cookie to be sent over HTTP during local testing. Be sure to set it back to `True` in production to ensure cookies are only sent over secure HTTPS connections.

### Example for Development Environment:

You can conditionally set `SESSION_COOKIE_SECURE` based on the environment:

```python
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    SESSION_COOKIE_SECURE = True
else:
    SESSION_COOKIE_SECURE = False  # Allow cookies over HTTP for local development
```

### Important Notes:

- **Only set `SESSION_COOKIE_SECURE = False` in non-production environments.**
- Always use `SESSION_COOKIE_SECURE = True` in production to protect cookies from being transmitted over insecure channels.

### Debugging Tips:

To confirm the issue, inspect the `Set-Cookie` header in the server response after login or signup:

```python
print(response.headers.get("Set-Cookie"))
```

Expected Output:

```
Set-Cookie: sessionid=abc123; Path=/; HttpOnly
```

If the header is missing when `SESSION_COOKIE_SECURE = True`, it means the server is running over HTTP, and the session cookie is being blocked.
