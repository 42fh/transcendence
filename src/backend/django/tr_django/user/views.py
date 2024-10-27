from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.models import User
from user.models import UserProfile
from .forms import UserProfileForm
from django.http import JsonResponse
import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt


def user_profile(request, username):
    user = User.objects.get(username=username)
    profile, created = UserProfile.objects.get_or_create(user=user)

    if request.method == "POST":
        form = UserProfileForm(request.POST, request.FILES, instance=profile)
        if form.is_valid():
            form.save()
            return redirect("user_profile", username=username)
    else:
        form = UserProfileForm(instance=profile)

    return render(
        request, "user_profile.html", {"user": user, "profile": profile, "form": form}
    )

@csrf_exempt
def api_login(request):
    if request.method == "POST":
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            return JsonResponse({"message": "Login successful", "username": user.username})
        else:
            return JsonResponse({"error": "Invalid credentials"}, status=401)
    return JsonResponse({"error": "Only POST method is allowed"}, status=405)


@csrf_exempt
@login_required
def api_logout(request):
    logout(request)
    return JsonResponse({"message": "Logout successful"})

