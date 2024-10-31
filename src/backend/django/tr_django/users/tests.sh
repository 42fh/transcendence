#!/bin/bash

# This test script is to run specific test cases for the users app outside Docker

# Function to display usage instructions
function usage() {
    echo "Usage: $0 {1|2|3|A}"
    echo "Options:"
    echo "  1  Run SignupTestCase"
    echo "  2  Run CustomUserModelTestCase"
    echo "  3  Run CustomUserStatusVisibilityTestCase"
    echo "  A  Run all tests in the users app"
    exit 1
}

# Check if an argument is provided
if [ -z "$1" ]; then
    usage
fi

# Make migrations for the users app
python ../manage.py makemigrations users --settings=tr_django.test_settings

# Apply migrations
python ../manage.py migrate --settings=tr_django.test_settings

# Run tests based on the argument
case "$1" in
    1)
        python ../manage.py test users.tests.SignupTestCase --settings=tr_django.test_settings
        ;;
    2)
        python ../manage.py test users.tests.CustomUserModelTestCase --settings=tr_django.test_settings
        ;;
    3)
        python ../manage.py test users.tests.CustomUserStatusVisibilityTestCase --settings=tr_django.test_settings
        ;;
    A)
        python ../manage.py test users --settings=tr_django.test_settings
        ;;
    *)
        usage
        ;;
esac
