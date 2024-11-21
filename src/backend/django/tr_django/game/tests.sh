#!/bin/bash

# Function to display usage instructions
function usage() {
    echo "Usage: $0 [-m] {1|2|3|4|5|6|7|8|9|A}"
    echo "Options:"
    echo "  -m, --migrate  Run migrations before tests"
    echo "  1  Run GameModeTestCase"
    echo "  2  Run LegacyGameAppTestsRefactored"
    echo "  3  Run PlayerModelTest"
    echo "  4  Run PlayerStatsTest"
    echo "  5  Run SingleGameTest"
    echo "  6  Run TournamentCreationTest"
    echo "  7  Run TournamentAPITest"
    echo "  8  Run TournamentEnrollmentTest"
    echo "  9  Run TournamentServiceTest"
    echo "  A  Run all tests in the game app"
    exit 1
}

# Initialize variables
RUN_MIGRATIONS=false
TEST_CASE=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--migrate)
            RUN_MIGRATIONS=true
            shift
            ;;
        1|2|3|4|5|6|7|8|9|A)
            TEST_CASE=$1
            shift
            ;;
        *)
            usage
            ;;
    esac
done

# Check if a test case was provided
if [ -z "$TEST_CASE" ]; then
    usage
fi

# Run migrations if requested
if [ "$RUN_MIGRATIONS" = true ]; then
    echo "Running migrations..."
    python ../manage.py makemigrations users game --settings=tr_django.test_settings
    python ../manage.py migrate --settings=tr_django.test_settings
fi

# Run tests based on the argument
case "$TEST_CASE" in
    1)
        python ../manage.py test game.tests.GameModeTestCase --settings=tr_django.test_settings
        ;;
    2)
        python ../manage.py test game.tests.LegacyGameAppTestsRefactored --settings=tr_django.test_settings
        ;;
    3)
        python ../manage.py test game.tests.PlayerModelTest --settings=tr_django.test_settings
        ;;
    4)
        python ../manage.py test game.tests.PlayerStatsTest --settings=tr_django.test_settings
        ;;
    5)
        python ../manage.py test game.tests.SingleGameTest --settings=tr_django.test_settings
        ;;
    6)
        python ../manage.py test game.tests.TournamentCreationTest --settings=tr_django.test_settings
        ;;
    7)
        python ../manage.py test game.tests.TournamentAPITest --settings=tr_django.test_settings
        ;;
    8)
        python ../manage.py test game.tests.TournamentEnrollmentTest --settings=tr_django.test_settings
        ;;
    9)
        python ../manage.py test game.tests.TournamentServiceTest --settings=tr_django.test_settings
        ;;
    A)
        python ../manage.py test game --settings=tr_django.test_settings
        ;;
esac

# Check if tests passed
if [ $? -eq 0 ]; then
    echo -e "\033[0;32mAll tests passed!\033[0m"  # Green color
else
    echo -e "\033[0;31mTests failed!\033[0m"  # Red color
    exit 1
fi

echo "All done!"
