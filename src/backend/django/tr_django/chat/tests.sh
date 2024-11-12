#!/bin/bash

# This test script is to run specific test cases for the chat app outside Docker

# Function to display usage instructions
function usage() {
    echo "Usage: $0 {1|2|3|4|A}"
    echo "Options:"
    echo "  1  Run ChatModelUserTest"
    echo "  2  Run ChatRoomTestCase"
    echo "  3  Run MessageTestCase"
    echo "  4  Run ChatRoomQueryTestCase"
    echo "  A  Run all tests in the chat app"
    exit 1
}

# Check if an argument is provided
if [ -z "$1" ]; then
    usage
fi

# Make migrations for users and chat apps
python ../manage.py makemigrations users chat --settings=tr_django.test_settings

# Apply migrations
python ../manage.py migrate --settings=tr_django.test_settings

# Run tests based on the argument
case "$1" in
    1)
        python ../manage.py test chat.tests.ChatModelUserTest --settings=tr_django.test_settings
        ;;
    2)
        python ../manage.py test chat.tests.ChatRoomTestCase --settings=tr_django.test_settings
        ;;
    3)
        python ../manage.py test chat.tests.MessageTestCase --settings=tr_django.test_settings
        ;;
    4)
        python ../manage.py test chat.tests.ChatRoomQueryTestCase --settings=tr_django.test_settings
        ;;
    A)
        python ../manage.py test chat --settings=tr_django.test_settings
        ;;
    *)
        usage
        ;;
esac