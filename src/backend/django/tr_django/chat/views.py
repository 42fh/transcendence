from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User

@login_required
def chatPage(request):
    return render(request, "index.html")

@login_required
def create_one_to_one_chat(request):
    if request.method == "POST":
        other_user = request.POST.get("other_user")
        chat_room_url = f"/chat/{request.user.username}_{other_user}/"
        return JsonResponse({"chat_room_url": chat_room_url})
    return JsonResponse({"error": "Invalid request"}, status=400)

@login_required
def one_to_one_chat(request, room_name):
    return JsonResponse({"room_name": room_name})


@login_required
def get_username(request):
    username = request.user.username if request.user.is_authenticated else "Guest"
    return JsonResponse({"username": username})


@login_required
def get_user_list(request):
    # Fetch all users except the current user
    # users = User.objects.exclude(username=request.user.username)
    users = User.objects.exclude(username=request.user.username).filter(is_active=True)
    user_list = [{"username": user.username} for user in users]
    return JsonResponse({"users": user_list})