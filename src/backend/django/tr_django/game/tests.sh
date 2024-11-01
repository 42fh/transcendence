#!/bin/bash

# This test script is to run specific test cases for the game app outside Docker

# Function to display usage instructions
function usage() {
    echo "Usage: $0 {1|A}"
    echo "Options:"
    echo "  1  Run GameModeTestCase"
    echo "  A  Run all tests in the game app"
    exit 1
}

# Check if an argument is provided
if [ -z "$1" ]; then
    usage
fi

# Make migrations for the game app
python ../manage.py makemigrations game --settings=tr_django.test_settings

# Apply migrations
python ../manage.py migrate --settings=tr_django.test_settings

# Run tests based on the argument
case "$1" in
    1)
        python ../manage.py test game.tests.GameModeTestCase --settings=tr_django.test_settings
        ;;
    A)
        python ../manage.py test game --settings=tr_django.test_settings
        ;;
    *)
        usage
        ;;
esac
