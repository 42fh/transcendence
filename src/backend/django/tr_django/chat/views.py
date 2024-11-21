from django.shortcuts import render
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from .models import ChatRoom, Message, BlockedUser
from django.views.decorators.csrf import csrf_exempt
from users.models import CustomUser
import json
from django.middleware.csrf import get_token
from django.utils import timezone
from channels.db import database_sync_to_async


@login_required
def users(request):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({"status": "error", "message": "User not authenticated"}, status=401)

        users = CustomUser.objects.exclude(username=request.user.username).values("username")
        print(f"DEBUG: Retrieved {len(users)} users")

        # Get blocked users
        blocked_users = set(
            BlockedUser.objects.filter(user=request.user).values_list("blocked_user__username", flat=True)
        )
        print(f"DEBUG: Blocked users: {blocked_users}")

        # Get users who blocked current user
        blocked_by_users = set(
            BlockedUser.objects.filter(blocked_user=request.user).values_list("user__username", flat=True)
        )
        print(f"DEBUG: Blocked by users: {blocked_by_users}")

        recent_chats = (
            ChatRoom.objects.filter(models.Q(user1=request.user) | models.Q(user2=request.user))
            .select_related("user1", "user2")
            .order_by("-last_message_at")
        )
        print(f"DEBUG: Retrieved {recent_chats.count()} recent chats")

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
        print(f"DEBUG: Error in users: {str(e)}")
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


@csrf_exempt
@login_required
def blocked_user(request):
    try:
        if request.method == "GET":
            # Get blocked users
            blocked_users = set(
                BlockedUser.objects.filter(user=request.user).values_list("blocked_user__username", flat=True)
            )
            blocked_by_users = set(
                BlockedUser.objects.filter(blocked_user=request.user).values_list("user__username", flat=True)
            )
            all_blocked_users = blocked_users.union(blocked_by_users)

            return JsonResponse({"status": "success", "blocked_users": list(all_blocked_users)})

        data = json.loads(request.body)
        username = data.get("username")

        if not username:
            return JsonResponse({"status": "error", "message": "Username required"}, status=400)

        user = CustomUser.objects.filter(username=username).first()
        if not user:
            return JsonResponse({"status": "error", "message": "User not found"}, status=404)

        if user == request.user:
            return JsonResponse({"status": "error", "message": "Cannot block/unblock yourself"}, status=400)

        if request.method == "POST":
            BlockedUser.objects.get_or_create(user=request.user, blocked_user=user)
            return JsonResponse({"status": "success", "message": f"Blocked user {username}"})
        elif request.method == "DELETE":
            BlockedUser.objects.filter(user=request.user, blocked_user=user).delete()
            return JsonResponse({"status": "success", "message": f"Unblocked user {username}"})
        else:
            return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)


@database_sync_to_async
def get_or_create_chat_room(self):
    try:
        # Sort usernames to ensure consistent room_id regardless of order
        usernames = sorted(self.room_name.split("_"))
        if len(usernames) != 2:
            raise ValueError("Invalid room name format")

        user1 = CustomUser.objects.get(username=usernames[0])
        user2 = CustomUser.objects.get(username=usernames[1])

        chat_room, created = ChatRoom.objects.create_room(user1, user2)

        if chat_room:
            chat_room.last_message_at = timezone.now()
            chat_room.save(update_fields=["last_message_at"])

        print(f"DEBUG: Chat room {'created' if created else 'retrieved'}: {chat_room}")
        return chat_room

    except CustomUser.DoesNotExist as e:
        raise ObjectDoesNotExist(f"User not found: {str(e)}")
    except Exception as e:
        print(f"DEBUG: Error in get_or_create_chat_room: {str(e)}")
        raise
