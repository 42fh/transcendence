

## Notes
These tests could be store under
```bash
management/commands
```
And then ran with
```bash
python manage.py create_user
```

Or in the app dir itself as test_user_model.py (I copied Daniil's approach and kept this test strictly for DB testing). MY understanding is that the tests in the directory are self contained, quick tests. Theese scripts rather build a fundation for a member of the team to test in the browser.

To run the tests in the game or user app you should just run 
```bash
python manage.py test -v 2
```
I added the second level of verbosity just to be sure the tests actually run.

I think this command could be a [pre-commit hook](https://www.atlassian.com/git/tutorials/git-hooks)



## Scripts

### 1. `create_user.py`
This script creates a new user in the Django application. If the user already exists, it does not create a new one.

```bash
python manage.py shell < user/scripts/create_user.py
```

- Defines a username and password.
- Uses `get_or_create` to ensure the user is only created if they do not already exist.
- Sets the password securely before saving the user to the database.

### 2. `create_user_profile.py`
This script creates a `UserProfile` for an existing user. It checks if the user exists first and then creates the profile if it doesn't exist.

```bash
python manage.py shell < user/scripts/create_user_profile.py
```

**Functionality:**
- Checks for the existence of a user with the specified username.
- If the user exists, it attempts to retrieve or create a `UserProfile` associated with that user.
- Prints out whether the user profile was created or already exists.

### 3. `check_user_profile.py`
This script checks if a user and their corresponding `UserProfile` exist.

```bash
python manage.py shell < user/scripts/check_user_profile.py
```

**Functionality:**
- Checks for the existence of a user by username.
- If the user exists, it checks for their `UserProfile` and prints the relevant information.
- If either the user or their profile does not exist, appropriate messages are printed.
