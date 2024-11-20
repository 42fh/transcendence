#!/bin/bash

# Get the absolute path to the directory containing this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Construct path to manage.py (two directories up from the script location)
MANAGE_PY="$SCRIPT_DIR/../manage.py"

# Update usage function
function usage() {
    echo "Usage: $0 {3|4|5|6|7|8|9|10|A}"
    echo "Options:"
    echo "  1  Run tests in test_api_auth.py (SignupTestCase)"
    echo "  2  Run tests in test_models.py (CustomUserModelTestCase)"
    echo "  3  Run tests in test_models.py (CustomUserStatusVisibilityTestCase)"
    echo "  4  Run tests in test_models.py (CustomUserRelationshipTestCase - friends)"
    echo "  5  Run tests in test_models.py (CustomUserRelationshipTestCase - visibility group)"
    echo "  6  Run tests in test_api_auth.py (FriendRequestTests)"
    echo "  7  Run tests in test_api_user.py (APIUserListGetTests)"
    echo "  8  Run tests in test_api_user.py (APIUserDetailGetTests)"
    echo "  9  Run tests in test_api_user.py (APIUserUpdateTests)"
    echo "  10 Run tests in test_api_user.py (FriendsListViewTests)"
    echo "  A  Run all tests"
    exit 1
}

# Check if manage.py exists
if [ ! -f "$MANAGE_PY" ]; then
    echo "Error: manage.py not found at $MANAGE_PY"
    exit 1
fi

# Check if an argument is provided
if [ -z "$1" ]; then
    usage
fi

# Add to case statement
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
        python "$MANAGE_PY" test users.tests.test_models.CustomUserRelationshipTestCase --settings=tr_django.test_settings
        ;;
    5)
        python "$MANAGE_PY" test users.tests.test_models.CustomUserRelationshipTestCase --settings=tr_django.test_settings
        ;;
    6)
        python "$MANAGE_PY" test users.tests.test_api_auth.FriendRequestTests --settings=tr_django.test_settings
        ;;
    7)
        python "$MANAGE_PY" test users.tests.test_api_user.APIUserListGetTests --settings=tr_django.test_settings
        ;;
    8)
        python "$MANAGE_PY" test users.tests.test_api_user.APIUserDetailGetTests --settings=tr_django.test_settings
        ;;
    9)
        python "$MANAGE_PY" test users.tests.test_api_user.APIUserUpdateTests --settings=tr_django.test_settings
        ;;
    10)
        python "$MANAGE_PY" test users.tests.test_api_user.FriendsListViewTests --settings=tr_django.test_settings
        ;;
    A)
        python "$MANAGE_PY" test users.tests --settings=tr_django.test_settings -v 2
        ;;
    *)
        usage
        ;;
esac 