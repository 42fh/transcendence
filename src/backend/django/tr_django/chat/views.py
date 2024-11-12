from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.db import models
from django.core.exceptions import ObjectDoesNotExist
from .models import ChatRoom, Message, BlockedUser, ChatNotification
import json
from django.middleware.csrf import get_token


@login_required
def get_username(request):
    """Return the current user's username and CSRF token."""
    return JsonResponse({"username": request.user.username, "csrfToken": get_token(request)})


@login_required
def get_user_list(request):
    try:
        users = User.objects.exclude(username=request.user.username).values("username")

        # Get blocked users
        blocked_users = set(
            BlockedUser.objects.filter(user=request.user).values_list("blocked_user__username", flat=True)
        )

        # Get users who blocked current user
        blocked_by_users = set(
            BlockedUser.objects.filter(blocked_user=request.user).values_list("user__username", flat=True)
        )

        recent_chats = (
            ChatRoom.objects.filter(models.Q(user1=request.user) | models.Q(user2=request.user))
            .select_related("user1", "user2")
            .order_by("-last_message_at")
        )

        users_with_chats = set()
        for chat in recent_chats:
            other_user = chat.user2 if chat.user1 == request.user else chat.user1
            users_with_chats.add(other_user.username)

        user_list = []
        for user in users:
            username = user["username"]
            user_data = {
                "username": username,
                "has_chat": username in users_with_chats,
                "is_blocked": username in blocked_users,
                "has_blocked_you": username in blocked_by_users,
            }
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
            return JsonResponse({"status": "error", "message": "Access denied"}, status=403)

        Message.objects.filter(room=chat_room, is_read=False).exclude(sender=request.user).update(is_read=True)

        return JsonResponse({"status": "success", "message": "Messages marked as read"})

    except ChatRoom.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Chat room not found"}, status=404)
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@login_required
def block_user(request):
    try:
        data = json.loads(request.body)
        username_to_block = data.get("username")

        if not username_to_block:
            return JsonResponse({"status": "error", "message": "Username required"}, status=400)

        user_to_block = User.objects.filter(username=username_to_block).first()
        if not user_to_block:
            return JsonResponse({"status": "error", "message": "User not found"}, status=404)

        if user_to_block == request.user:
            return JsonResponse({"status": "error", "message": "Cannot block yourself"}, status=400)

        BlockedUser.objects.get_or_create(user=request.user, blocked_user=user_to_block)
        return JsonResponse({"status": "success", "message": f"Blocked user {username_to_block}"})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@login_required
def unblock_user(request):
    try:
        data = json.loads(request.body)
        username_to_unblock = data.get("username")

        if not username_to_unblock:
            return JsonResponse({"status": "error", "message": "Username required"}, status=400)

        BlockedUser.objects.filter(user=request.user, blocked_user__username=username_to_unblock).delete()

        return JsonResponse({"status": "success", "message": f"Unblocked user {username_to_unblock}"})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@login_required
def get_notifications(request):
    try:
        notifications = (
            ChatNotification.objects.filter(recipient=request.user, is_read=False)
            .select_related("sender", "chat_room")
            .order_by("-created_at")
        )

        notification_data = [
            {
                "id": notif.id,
                "sender": notif.sender.username,
                "message": notif.message,
                "room_id": notif.chat_room.room_id,
                "created_at": notif.created_at.isoformat(),
            }
            for notif in notifications
        ]

        return JsonResponse({"status": "success", "notifications": notification_data})
    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@login_required
def mark_notification_read(request, notification_id):
    try:
        notification = ChatNotification.objects.get(id=notification_id, recipient=request.user)
        notification.is_read = True
        notification.save()
        return JsonResponse({"status": "success"})
    except ChatNotification.DoesNotExist:
        return JsonResponse({"status": "error", "message": "Notification not found"}, status=404)
