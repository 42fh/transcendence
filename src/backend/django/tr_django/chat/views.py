from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db import models
from django.core.exceptions import ObjectDoesNotExist
from .models import ChatRoom, Message


@login_required
def get_username(request):
    return JsonResponse({"username": request.user.username, "status": "success"})


@login_required
def get_user_list(request):
    """
    TODO: The following features are not used in front, only the basic user list
    Chat Status: if a user has chat with current user
     Recent Chats: chat room with current user sorted by the latest message.
     Unread Messages: track number unread messages.
    """
    try:
        # Get all active users except the current user
        users = (
            User.objects.exclude(username=request.user.username)
            # TODO: perhaps precise which is online/active
            # .filter(is_active=True)
            .values("username")
        )

        # recent chat rooms for the current user
        recent_chats = (
            ChatRoom.objects.filter(
                models.Q(user1=request.user) | models.Q(user2=request.user)
            )
            .select_related("user1", "user2")
            .order_by("-last_message_at")
        )

        # list of users having chats with current user
        users_with_chats = set()
        for chat in recent_chats:
            other_user = chat.user2 if chat.user1 == request.user else chat.user1
            users_with_chats.add(other_user.username)

        # user list with chat information
        user_list = []
        for user in users:
            username = user["username"]
            user_data = {
                "username": username,
                "has_chat": username in users_with_chats,
            }

            # Add unread message count
            if username in users_with_chats:
                room_id = "_".join(sorted([request.user.username, username]))

            user_list.append(user_data)

        return JsonResponse({"status": "success", "users": user_list})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


# TODO: Not currently used
def mark_messages_read(request, room_id):
    """Mark all messages in a room as read for the current user."""
    try:
        chat_room = ChatRoom.objects.get(room_id=room_id)

        if request.user not in [chat_room.user1, chat_room.user2]:
            return JsonResponse(
                {"status": "error", "message": "Access denied"}, status=403
            )

        Message.objects.filter(room=chat_room, is_read=False).exclude(
            sender=request.user
        ).update(is_read=True)

        return JsonResponse({"status": "success", "message": "Messages marked as read"})

    except ChatRoom.DoesNotExist:
        return JsonResponse(
            {"status": "error", "message": "Chat room not found"}, status=404
        )
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)
