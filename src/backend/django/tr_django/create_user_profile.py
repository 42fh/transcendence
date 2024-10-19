from django.contrib.auth.models import User
from user.models import UserProfile

# Find the existing user
user = User.objects.get(username='lmangall')

# Create a UserProfile for this user
profile = UserProfile.objects.create(
    user=user,
    bio="This is a test user.",
    location="Test City",
    level=1
)

print("UserProfile created:", profile)
