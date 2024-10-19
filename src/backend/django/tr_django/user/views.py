
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.models import User
from user.models import UserProfile
from .forms import UserProfileForm

# Check the difference with :
# def user_profile(request, username):
#     user = get_object_or_404(User, username=username)
#     profile = get_object_or_404(UserProfile, user=user)

def user_profile(request, username):
    user = User.objects.get(username=username)
    profile, created = UserProfile.objects.get_or_create(user=user)


    if request.method == 'POST':
        form = UserProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            return redirect('user_profile', username=username)
    else:
        form = UserProfileForm(instance=profile)

    return render(request, 'user_profile.html', {'user': user, 'profile': profile, 'form': form})

