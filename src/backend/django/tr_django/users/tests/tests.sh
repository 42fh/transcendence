#!/bin/bash

# Get the absolute path to the directory containing this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Modify this line to properly construct the path to manage.py
MANAGE_PY="$SCRIPT_DIR/../../manage.py"

# Add debug line to check if file exists
ls -l "$MANAGE_PY"

# Add debug output to help troubleshoot
echo "Script directory: $SCRIPT_DIR"
echo "Looking for manage.py at: $MANAGE_PY"
if [ ! -f "$MANAGE_PY" ]; then
    echo "Error: manage.py not found at expected location"
    exit 1
fi

# Check if the script is being run from its directory
CURRENT_DIR="$(pwd)"
if [ "$CURRENT_DIR" != "$SCRIPT_DIR" ]; then
    echo "Error: This script must be run from its own directory ($SCRIPT_DIR)"
    echo "Current directory: $CURRENT_DIR"
    echo "Please change to the script's directory and try again"
    exit 1
fi

# Add more detailed debug output
echo "Full path to script directory:"
echo "$SCRIPT_DIR"
echo
echo "Full path being checked for manage.py:"
realpath "$MANAGE_PY"
echo

# Function to display usage instructions
function usage() {
    echo "Usage: $0 {1|2|3|4|5|6|A}"
    echo "Options:"
    echo "  1  Run tests in test_api_auth.py (SignupTestCase)"
    echo "  2  Run tests in test_models.py (CustomUserModelTestCase)"
    echo "  3  Run tests in test_models.py (CustomUserStatusVisibilityTestCase)"
    echo "  4  Run tests in test_models.py (CustomUserRelationshipTestCase - friends and blocked)"
    echo "  5  Run tests in test_models.py (CustomUserRelationshipTestCase - visibility group)"
    echo "  6  Run tests in test_api_auth.py (FriendRequestTests)"
    echo "  A  Run all tests in the users app"
    exit 1
}

# Check if an argument is provided
if [ -z "$1" ]; then
    usage
fi

# Make migrations for the users app
python "$MANAGE_PY" makemigrations users --settings=tr_django.test_settings

# Apply migrations
python "$MANAGE_PY" migrate --settings=tr_django.test_settings

# Run tests based on the argument
case "$1" in
    1)
        python "$MANAGE_PY" test users.tests.test_api_auth.SignupTestCase --settings=tr_django.test_settings
        ;;
    2)
        python "$MANAGE_PY" test users.tests.test_models.CustomUserModelTestCase --settings=tr_django.test_settings
        ;;
    3)
        python "$MANAGE_PY" test users.tests.test_models.CustomUserStatusVisibilityTestCase --settings=tr_django.test_settings
        ;;
    4)
        python "$MANAGE_PY" test users.tests.test_models.CustomUserRelationshipTestCase.test_friends_and_blocked_users --settings=tr_django.test_settings
        ;;
    5)
        python "$MANAGE_PY" test users.tests.test_models.CustomUserRelationshipTestCase.test_custom_visibility_group --settings=tr_django.test_settings
        ;;
    6)
        python "$MANAGE_PY" test users.tests.test_api_auth.FriendRequestTests --settings=tr_django.test_settings
        ;;
    A)
        python "$MANAGE_PY" test users.tests --settings=tr_django.test_settings
        ;;
    *)
        usage
        ;;
esac
