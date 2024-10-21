from django.contrib.auth.models import User
from user.models import UserProfile

# Check if the user exists
username_to_check = "userX"
user = User.objects.filter(username=username_to_check).first()
if user:
    print("User exists:", user.username)

    # Check if a UserProfile exists for the user
    try:
        profile = UserProfile.objects.get(user=user)
        print("UserProfile exists:", profile)
    except UserProfile.DoesNotExist:
        print("UserProfile does not exist.")
else:
    print("User does not exist.")
