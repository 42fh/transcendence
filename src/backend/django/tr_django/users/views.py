"""Views for user authentication and management."""

import json
import logging
from django.contrib.auth import authenticate, login, logout, get_user
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password
from django.utils.decorators import method_decorator
from django.views import View
from users.models import CustomUser
from django.db.models import Q
from game.models import Player
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
import uuid


logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name="dispatch")
class SignupView(View):
    """
    A view to handle user sign-up.
    """

    def post(self, request):
        """
        Handle POST request to create a new user.
        """
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"success": False, "error": "Invalid JSON format", "action": "signup"}, status=400)

        username = data.get("username")
        password = data.get("password")

        # Check if username is taken
        if CustomUser.objects.filter(username=username).exists():
            return JsonResponse(
                {
                    "success": False,
                    "error": "Username is already taken.",
                    "action": "signup",
                },
                status=400,
            )
        # Create and save new user
        user = CustomUser.objects.create(username=username, password=make_password(password))

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)  # This creates the session for the new user
            # Return success response with username
            return JsonResponse(
                {
                    "success": True,
                    "message": "User created and logged in successfully.",
                    "username": username,
                    "id": str(user.id),
                    "action": "signup",
                }
            )
        # In case authentication fails for some reason, which is rare
        return JsonResponse(
            {
                "success": False,
                "error": "User created, but login failed.",
                "action": "signup",
            },
            status=500,
        )


@method_decorator(csrf_exempt, name="dispatch")
class LoginView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {"success": False, "error": "Invalid JSON format", "action": "login"},
                status=400,
            )

        username = data.get("username")
        password = data.get("password")

        # Authenticate user
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)  # Login and create session
            return JsonResponse(
                {
                    "success": True,
                    "message": "User logged in successfully.",
                    "username": username,
                    "id": str(user.id),
                    "action": "login",
                }
            )
        return JsonResponse(
            {
                "success": False,
                "error": "Invalid credentials.",
                "action": "login",
            },
            status=400,
        )


@method_decorator(csrf_exempt, name="dispatch")
class LogoutView(View):
    """
    View to handle user logout.
    https://docs.djangoproject.com/en/5.1/topics/auth/default/#how-to-log-a-user-out
    """

    def post(self, request):
        user = get_user(request)
        if user.is_authenticated:
            try:
                logout(request)
                logger.info("User '%s' logged out successfully.", user.username)
                return JsonResponse({"success": True, "message": "User logged out successfully."})
            except Exception as e:
                logger.error("Logout failed for user '%s': %s", user.username, e)
                return JsonResponse({"success": False, "error": f"Logout failed: {str(e)}"}, status=500)
        else:
            logger.warning("Unauthorized logout attempt detected.")
            return JsonResponse({"success": False, "error": "User is not logged in."}, status=401)


@method_decorator(csrf_exempt, name="dispatch")
class DeleteUserView(View):
    def _generate_unique_anon_username(self, user_id: str) -> str:
        """
        Generate a unique anonymous username.
        Adds an incremental suffix if the base username already exists.
        """
        base_username = f"user_{user_id[:8]}"
        username = base_username
        counter = 1

        while CustomUser.objects.filter(username=username).exists():
            username = f"{base_username}_{counter}"
            counter += 1

        return username

    def post(self, request):
        """Handle user account deletion by anonymizing personal data"""
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)

        try:
            data = json.loads(request.body)
            password = data.get("password")

            if not password:
                return JsonResponse({"error": "Password is required to delete account"}, status=400)

            # Verify password
            if not request.user.check_password(password):
                return JsonResponse({"error": "Invalid password"}, status=403)

            # Store IDs for logging
            user_id = str(request.user.id)
            original_username = request.user.username

            # Generate unique anonymous username
            anon_username = self._generate_unique_anon_username(user_id)

            # Anonymize personal data
            request.user.username = anon_username
            request.user.email = None
            request.user.first_name = ""
            request.user.last_name = ""
            request.user.bio = ""
            request.user.telephone_number = ""
            request.user.pronoun = ""
            request.user.avatar = None
            request.user.is_active = False
            request.user.password = make_password(None)
            request.user.email_verified = False

            # Clear social connections
            request.user.friends.clear()
            request.user.friend_requests_sent.clear()
            request.user.friend_requests_received.clear()

            # Set visibility to private
            request.user.visibility_online_status = "nobody"
            request.user.visibility_user_profile = "nobody"

            request.user.save()

            # Log the anonymization
            logger.info(f"User {original_username} (ID: {user_id}) successfully anonymized to {anon_username}")

            # Logout the user
            logout(request)

            return JsonResponse(
                {"message": "User account successfully deleted and data anonymized", "user_id": user_id}
            )

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid request format"}, status=400)
        except Exception as e:
            logger.error(f"Error anonymizing user account: {str(e)}")
            return JsonResponse({"error": "Failed to delete account"}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class UsersListView(View):
    """
    GET: List users with basic information
    """

    def get(self, request):
        search = request.GET.get("search", "")
        page = int(request.GET.get("page", 1))
        per_page = int(request.GET.get("per_page", 10))

        try:
            page = int(page)
            per_page = int(per_page)
            if page <= 0 or per_page <= 0:
                raise ValueError
        except ValueError:
            return JsonResponse({"error": "Invalid pagination parameters"}, status=400)

        # Filter users by username or email
        users = CustomUser.objects.filter(Q(username__icontains=search) | Q(email__icontains=search))
        paginator = Paginator(users, per_page)

        try:
            users_page = paginator.page(page)
        except EmptyPage:
            return JsonResponse({"error": "Page not found"}, status=404)
        except PageNotAnInteger:
            return JsonResponse({"error": "Invalid page number"}, status=400)

        users_data = [
            {
                "id": str(user.id),
                "username": user.username,
                "avatar": user.avatar.url if user.avatar else None,
                "is_active": user.is_active,
                "visibility_online_status": user.visibility_online_status,
                "visibility_user_profile": user.visibility_user_profile,
            }
            for user in users_page
        ]

        return JsonResponse(
            {
                "users": users_data,
                "pagination": {
                    "total": paginator.count,
                    "page": page,
                    "per_page": per_page,
                    "total_pages": paginator.num_pages,
                },
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class UserDetailView(View):
    """View for getting detailed user information including game stats and match history"""

    def get(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)

            try:
                player = user.player
                # Get recent matches
                recent_matches = []
                player_stats = player.playergamestats_set.select_related("single_game", "tournament_game").order_by(
                    "-joined_at"
                )[:5]

                for stat in player_stats:
                    game = stat.game
                    if game:
                        match_data = {
                            "game_id": str(game.id),
                            "date": game.start_date,
                            "score": stat.score,
                            "won": game.winner == player if game.winner else None,
                            "game_type": "tournament" if stat.tournament_game else "single",
                            "opponent": None,
                        }

                        other_stat = game.playergamestats_set.exclude(player=player).first()
                        if other_stat:
                            match_data["opponent"] = {
                                "username": other_stat.player.username,
                                "display_name": other_stat.player.get_display_name,
                                "score": other_stat.score,
                            }

                        recent_matches.append(match_data)

                user_data = {
                    "id": str(user.id),
                    "username": user.username,
                    "email": user.email,
                    "avatar": user.avatar.url if user.avatar else None,
                    "bio": user.bio,
                    "telephone_number": user.telephone_number,
                    "pronoun": user.pronoun,
                    "is_active": user.is_active,
                    "visibility_online_status": user.visibility_online_status,
                    "visibility_user_profile": user.visibility_user_profile,
                    "stats": {
                        "wins": player.wins,
                        "losses": player.losses,
                        "win_ratio": player.win_ratio(),
                        "display_name": player.get_display_name,
                    },
                    "recent_matches": recent_matches,
                }

                return JsonResponse(user_data)

            except Player.DoesNotExist:
                return JsonResponse({"error": "Player profile not found"}, status=404)

        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

    def patch(self, request, user_id):
        """Handle PATCH request to update user details"""
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=401)

        # Check if user is updating their own profile
        if str(request.user.id) != str(user_id):
            return JsonResponse({"error": "Cannot update other users' profiles"}, status=403)

        try:
            data = json.loads(request.body)
            user = request.user

            # Fields that can be updated
            updatable_fields = {
                "first_name",
                "last_name",
                "email",
                "bio",
                "telephone_number",
                "pronoun",
                "visibility_online_status",
                "visibility_user_profile",
            }

            # Handle avatar separately if it's in request.FILES
            if request.FILES.get("avatar"):
                user.avatar = request.FILES["avatar"]

            # Update other fields if they exist in the request
            for field in updatable_fields:
                if field in data:
                    setattr(user, field, data[field])

            user.save()

            # Return the same format as your GET response
            player = user.player
            user_data = {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "avatar": user.avatar.url if user.avatar else None,
                "bio": user.bio,
                "telephone_number": user.telephone_number,
                "pronoun": user.pronoun,
                "is_active": user.is_active,
                "visibility_online_status": user.visibility_online_status,
                "visibility_user_profile": user.visibility_user_profile,
                "stats": {
                    "wins": player.wins,
                    "losses": player.losses,
                    "win_ratio": player.win_ratio(),
                    "display_name": player.get_display_name,
                },
            }

            return JsonResponse(user_data)

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)


@method_decorator(csrf_exempt, name="dispatch")
class FriendsListView(View):
    """View for listing a user's friends with pagination and search capabilities"""

    def get(self, request, user_id):
        try:
            user = CustomUser.objects.get(id=user_id)

            # Get query parameters
            search = request.GET.get("search", "")
            page = request.GET.get("page", 1)
            per_page = request.GET.get("per_page", 10)

            try:
                page = int(page)
                per_page = int(per_page)
                if page <= 0 or per_page <= 0:
                    raise ValueError
            except ValueError:
                return JsonResponse({"error": "Invalid pagination parameters"}, status=400)

            # Get friends with search filter
            friends = user.friends.filter(Q(username__icontains=search)).order_by("username")

            # Paginate results
            paginator = Paginator(friends, per_page)

            try:
                friends_page = paginator.page(page)
            except EmptyPage:
                return JsonResponse({"error": "Page not found"}, status=404)
            except PageNotAnInteger:
                return JsonResponse({"error": "Invalid page number"}, status=400)

            # Format friend data with minimal information
            friends_data = [
                {
                    "id": str(friend.id),
                    "username": friend.username,
                    "avatar": friend.avatar.url if friend.avatar else None,
                }
                for friend in friends_page
            ]

            return JsonResponse(
                {
                    "friends": friends_data,
                    "pagination": {
                        "total": paginator.count,
                        "page": page,
                        "per_page": per_page,
                        "total_pages": paginator.num_pages,
                    },
                }
            )

        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@method_decorator(csrf_exempt, name="dispatch")
class FriendRequestsView(View):
    """
    Handle friend requests

    Expected request body formats:
    POST: {"to_user_id": "<uuid>"}
    PATCH: {"from_user_id": "<uuid>", "action": "accept" | "reject"}
    DELETE: {"to_user_id": "<uuid>"}
    """

    def get(self, request):
        """List friend requests (both sent and received)"""
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)

        sent_requests = [
            {
                "id": str(user.id),
                "username": user.username,
                "avatar": user.avatar.url if user.avatar else None,
                "status": "sent",
            }
            for user in request.user.friend_requests_sent.all()
        ]

        received_requests = [
            {
                "id": str(user.id),
                "username": user.username,
                "avatar": user.avatar.url if user.avatar else None,
                "status": "received",
            }
            for user in request.user.friend_requests_received.all()
        ]

        return JsonResponse({"sent": sent_requests, "received": received_requests})

    def post(self, request):
        """Send a friend request"""
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)

        try:
            data = json.loads(request.body)
            to_user_id = data.get("to_user_id")

            if not to_user_id:
                return JsonResponse(
                    {"error": "Please specify the user you want to send a friend request to"}, status=400
                )

            # Add validation for sending request to self
            if str(to_user_id) == str(request.user.id):
                return JsonResponse({"error": "Cannot send friend request to yourself"}, status=400)

            # First validate UUID format
            try:
                uuid_obj = uuid.UUID(str(to_user_id))
            except ValueError:
                return JsonResponse({"error": "User not found"}, status=404)

            # Then try to get the user
            try:
                to_user = CustomUser.objects.get(id=uuid_obj)
            except CustomUser.DoesNotExist:
                return JsonResponse({"error": "User not found"}, status=404)

            # Check if already friends
            if request.user.is_friend_with(to_user):
                return JsonResponse({"error": "You are already friends with this user"}, status=400)

            # Check if request already sent
            if to_user in request.user.friend_requests_sent.all():
                return JsonResponse({"error": "You have already sent a friend request to this user"}, status=400)

            request.user.send_friend_request(to_user)
            return JsonResponse(
                {
                    "message": "Friend request sent successfully",
                    "to_user": {"id": str(to_user.id), "username": to_user.username},
                }
            )

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid request format"}, status=400)

    def patch(self, request):
        """Accept/reject friend request"""
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)

        try:
            data = json.loads(request.body)
            from_user_id = data.get("from_user_id")
            action = data.get("action")

            if not from_user_id:
                return JsonResponse(
                    {"error": "Please specify the user whose friend request you want to respond to"}, status=400
                )

            if action not in ["accept", "reject"]:
                return JsonResponse(
                    {"error": "Please specify whether you want to accept or reject the friend request"}, status=400
                )

            try:
                from_user = CustomUser.objects.get(id=from_user_id)
            except CustomUser.DoesNotExist:
                return JsonResponse({"error": "User not found"}, status=404)

            # Check if there's a pending request
            if from_user not in request.user.friend_requests_received.all():
                return JsonResponse({"error": "No pending friend request from this user"}, status=404)

            if action == "accept":
                request.user.accept_friend_request(from_user)
                message = "Friend request accepted successfully"
            else:
                request.user.reject_friend_request(from_user)
                message = "Friend request rejected"

            return JsonResponse({"message": message})

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid request format"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    def delete(self, request):
        """Cancel friend request"""
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)

        try:
            data = json.loads(request.body)
            to_user_id = data.get("to_user_id")

            if not to_user_id:
                return JsonResponse(
                    {"error": "Please specify the user whose friend request you want to cancel"}, status=400
                )

            try:
                to_user = CustomUser.objects.get(id=to_user_id)
            except CustomUser.DoesNotExist:
                return JsonResponse({"error": "User not found"}, status=404)

            # Check if there's a pending request
            if to_user not in request.user.friend_requests_sent.all():
                return JsonResponse({"error": "No pending friend request to this user"}, status=404)

            request.user.cancel_friend_request(to_user)
            return JsonResponse({"message": "Friend request cancelled successfully"})

        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid request format"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
