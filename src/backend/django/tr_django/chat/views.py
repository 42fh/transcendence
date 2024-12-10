from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from .models import ChatRoom, Message, BlockedUser, Notification
from django.views.decorators.csrf import csrf_exempt
from users.models import CustomUser
from django.utils import timezone
from channels.db import database_sync_to_async
import json
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@login_required
def rooms(request):
    try:
        if not request.user.is_authenticated:
            return JsonResponse({"status": "error", "message": "User not authenticated"}, status=401)

        users = CustomUser.objects.exclude(username=request.user.username).values("username")
        # print(f"DEBUG: Retrieved {len(users)} users")

        blocked_users = set(
            BlockedUser.objects.filter(user=request.user).values_list("blocked_user__username", flat=True)
        )
        print(f"DEBUG: Blocked users: {blocked_users}")
        blocked_by_users = set(
            BlockedUser.objects.filter(blocked_user=request.user).values_list("user__username", flat=True)
        )
        print(f"DEBUG: Blocked by users: {blocked_by_users}")
        all_blocked_users = blocked_users.union(blocked_by_users)

        # Exclude blocked users from the users queryset
        users = (
            CustomUser.objects.exclude(username=request.user.username)
            .exclude(username__in=all_blocked_users)
            .values("username")
        )
        print(f"DEBUG: Retrieved {len(users)} users after filtering blocked users")

        # Log the current user
        print(f"DEBUG: Current user: {request.user.username}")

        recent_chats = (
            ChatRoom.objects.filter(
                (models.Q(user1=request.user) | models.Q(user2=request.user))
                & ~models.Q(user1__username__in=all_blocked_users)
                & ~models.Q(user2__username__in=all_blocked_users)
            )
            .select_related("user1", "user2")
            .order_by("-last_message_at")
        )

        # Log the retrieved recent chats
        print(f"DEBUG: Retrieved {recent_chats.count()} recent chats for user: {request.user.username}")

        # Create a set of users with whom the current user has conversations
        users_with_chats = set()
        for chat in recent_chats:
            other_user = chat.user2 if chat.user1 == request.user else chat.user1
            users_with_chats.add(other_user.username)

        users = users.filter(username__in=users_with_chats)

        user_list = []
        for user in users:
            username = user["username"]
            unread_count = (
                Message.objects.filter(room__user1=request.user, room__user2__username=username, is_read=False).count()
                + Message.objects.filter(
                    room__user2=request.user, room__user1__username=username, is_read=False
                ).count()
            )

            user_data = {
                "username": username,
                "unread_messages": unread_count,
            }
            user_list.append(user_data)
        if user_list:
            return JsonResponse({"status": "success", "users": user_list})
        else:
            return JsonResponse({"status": "success", "users": []})  # Return empty list if no conversations

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


@login_required
@csrf_exempt
def notifications(request):
    try:
        logger.debug("Notifications view accessed")
        logger.debug(f"User authenticated: {request.user}")
        logger.debug(f"User ID: {request.user.id}")

        if request.method == "GET":
            try:
                notifications = Notification.objects.filter(user=request.user).values(
                    "id", "message", "created_at", "is_read", "url"
                )
                logger.debug(f"Notifications found: {list(notifications)}")

                notification_list = list(notifications)

                for notification in notification_list:
                    notification["created_at"] = notification["created_at"].isoformat()

                return JsonResponse({"status": "success", "notifications": notification_list})
            except Exception as query_error:
                logger.error("Error querying notifications", exc_info=True)
                return JsonResponse(
                    {"status": "error", "message": f"Database query error: {str(query_error)}"}, status=500
                )

        elif request.method == "PATCH":
            try:
                body = json.loads(request.body)
                is_read = body.get("is_read")
                url = body.get("url")

                if is_read is None and url is None:
                    return JsonResponse(
                        {"status": "error", "message": "At least one field (is_read or url) is required"}, status=400
                    )

                update_fields = {}
                if is_read is not None:
                    update_fields["is_read"] = is_read
                if url is not None:
                    Notification.objects.filter(user=request.user).update(url=url)

                Notification.objects.filter(user=request.user).update(**update_fields)

                return JsonResponse({"status": "success", "message": "Notifications updated successfully"})
            except Exception as e:
                logger.error("Error updating notifications", exc_info=True)
                return JsonResponse({"status": "error", "message": f"Internal server error: {str(e)}"}, status=500)

        elif request.method == "POST":
            try:
                body = json.loads(request.body)
                message = body.get("message")
                url = body.get("url")

                if not message:
                    return JsonResponse({"status": "error", "message": "Missing message field"}, status=400)

                notification = Notification.objects.create(user=request.user, message=message, url=url)

                return JsonResponse(
                    {"status": "success", "message": "Notification created successfully", "id": notification.id}
                )
            except Exception as e:
                logger.error("Error creating notification", exc_info=True)
                return JsonResponse({"status": "error", "message": f"Internal server error: {str(e)}"}, status=500)

        return JsonResponse({"status": "error", "message": "Invalid request method"}, status=405)

    except Exception as e:
        logger.error("Unexpected error in notifications view", exc_info=True)
        return JsonResponse({"status": "error", "message": f"Internal server error: {str(e)}"}, status=500)
