# Update usage function
function usage() {
    echo "Usage: $0 {2|3|4|5|6|7|8|9|10|A}"
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

# Add to case statement
case "$1" in
    # ... existing cases ...
    10)
        python "$MANAGE_PY" test users.tests.test_api_user.FriendsListViewTests --settings=tr_django.test_settings
        ;;
    A)
        python "$MANAGE_PY" test users.tests --settings=tr_django.test_settings
        ;;
    *)
        usage
        ;;
esac 