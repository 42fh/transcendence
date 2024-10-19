
from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from user.models import UserProfile

def user_profile(request, username):
    user = get_object_or_404(User, username=username)
    profile = get_object_or_404(UserProfile, user=user)

    return render(request, 'user_profile.html', {'user': user, 'profile': profile})

