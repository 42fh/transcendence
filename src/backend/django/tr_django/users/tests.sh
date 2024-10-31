# This test scirpt is to run the tests for the users app outside Docker
# Make migrations for the users app
python ../manage.py makemigrations users --settings=tr_django.test_settings

# Apply migrations
python ../manage.py migrate --settings=tr_django.test_settings

# Run tests for the users app
python ../manage.py test users --settings=tr_django.test_settings