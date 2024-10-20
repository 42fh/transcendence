from django.contrib.auth.models import User

# Define the username and password
username = 'userX'
password = 'password123' 

# Create a new user
user, created = User.objects.get_or_create(username=username)

if created:
    user.set_password(password)  # Set the password securely
    user.save()  # Save the user instance to the database
    print(f"User '{username}' created successfully.")
else:
    print(f"User '{username}' already exists.")
