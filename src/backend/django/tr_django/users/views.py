"""Views for user authentication and management."""

import json
import logging
import random
import os
import requests
from dotenv import load_dotenv
from django.utils import timezone
from datetime import timedelta
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
from uuid import UUID
from django.core.exceptions import ValidationError
import uuid
from django.conf import settings
import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.shortcuts import redirect
from urllib.parse import quote

from django.contrib.auth.models import User

logger = logging.getLogger(__name__)
load_dotenv(override=False)

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
            print("Session Key After Login:", request.session.session_key)  # Should not be None
            print("Session Data:", request.session.items())  # Debug session contents
            response = JsonResponse(
                {
                    "success": True,
                    "message": "User created and logged in successfully.",
                    "username": username,
                    "id": str(user.id),
                    "action": "signup",
                }
            )
            print("Set-Cookie Header in SignupView Response:", response.get("Set-Cookie"))  # Debug
            return response

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
class SendEmailVerificationView(View):
    """
    View to handle sending email verification emails.
    https://docs.djangoproject.com/en/5.1/topics/email/
    """

    def post(self, request):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)

        try:
            # Generate random 6-digit code
            verification_code = str(random.randint(100000, 999999))
            # Send email with verification code
            send_mail(
                "PONG | Verification code",
                f"Your verification code is: {verification_code}",
                f"{os.getenv("EMAIL_HOST_USER")}",
                [request.user.email],
                fail_silently=False,
            )
            # Store verification code and expiry time in user object
            request.user.two_factor_code = verification_code
            request.user.two_factor_code_expires_at = timezone.now() + timedelta(minutes=1)
            request.user.save()
            
            return JsonResponse({"message": "Email verification sent successfully"})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

@method_decorator(csrf_exempt, name="dispatch")
class ValidateEmailVerificationView(View):
    """
    View to handle email verification.
    """

    def post(self, request):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)

        try:
            data = json.loads(request.body)
            verification_code = data.get("token")

            if not verification_code:
                return JsonResponse({"error": "Verification code is required"}, status=400)

            if request.user.last_2fa_code == verification_code:
                return JsonResponse({"error": "Verification code is already used"}, status=400)
            if request.user.two_factor_code == verification_code and request.user.two_factor_code_expires_at > timezone.now():
                request.user.last_2fa_code = verification_code
                request.user.email_verified = True
                request.user.save()
                return JsonResponse({"message": "Email verification successful"})
            elif request.user.two_factor_code_expires_at < timezone.now():
                return JsonResponse({"error": "Verification code expired"}, status=400)
            else:
                return JsonResponse({"error": "Invalid verification code"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid request format"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

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


def login_with_42(request):
    print("fhdebug login_with_42 view called");
    base_url = "https://api.intra.42.fr/oauth/authorize"
    params = {
        "client_id": settings.FORTYTWO_CLIENT_ID,
        "redirect_uri": quote(settings.FORTYTWO_REDIRECT_URI),
        "response_type": "code",
        "scope": "public",
    }
    query_string = "&".join([f"{key}={value}" for key, value in params.items()])
    return redirect(f"{base_url}?{query_string}")

# https://api.intra.42.fr/oauth/authorize?client_id={client_id}&redirect_uri=http%3A%2F%2Flocalhost.000031.xyz:8080%2Fapi%2Foauth2%2Fredirection&response_type=code

def callback(request):
    print("fhdebug callback view called");
    code = request.GET.get('code')
    print("fhdebug code received: ", code);
    if not code:
        return redirect("/")

    # Exchange the code for an access token
    token_url = "https://api.intra.42.fr/oauth/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": settings.FORTYTWO_CLIENT_ID,
        "client_secret": settings.FORTYTWO_CLIENT_SECRET,
        "code": code,
        "redirect_uri": quote(settings.FORTYTWO_REDIRECT_URI),
    }

    response = requests.post(token_url, data=data)
    if response.status_code != 200:
        print("fhdebug: ", response.text)
        return JsonResponse({"error": "Failed to obtain access token"}, status=403)

    access_token = response.json().get("access_token")

    # Fetch user information
    user_info_url = "https://api.intra.42.fr/v2/me"
    headers = {"Authorization": f"Bearer {access_token}"}
    user_info_response = requests.get(user_info_url, headers=headers)
    if user_info_response.status_code != 200:
        return JsonResponse({"error": "Failed to fetch user info"}, status=403)

    user_data = user_info_response.json()

    # Create or log in the user
    username = user_data["login"]
    user, created = User.objects.get_or_create(username=username)
    login(request, user)

    return redirect('/')  # Redirect to a post-login page


@method_decorator(csrf_exempt, name="dispatch")
class UsersListView(View):
    """
    GET: List users with basic information
    """

    def get(self, request):
        # Add authentication check
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)

        logger.info("User '%s' is authenticated", request.user.username)
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
    """
    GET: View for getting detailed user information including game stats and match history
    PATCH: View for updating user details
    """

    def get(self, request, user_id):
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Authentication required"}, status=401)

        try:
            # First validate that the user exists
            user = CustomUser.objects.get(id=user_id)
            is_own_profile = str(request.user.id) == str(user_id)

            # Base data that's always sent
            user_data = {
                "id": str(user.id),
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "avatar": user.avatar.url if user.avatar else None,
                "bio": user.bio,
                "pronoun": user.pronoun,
                "is_active": user.is_active,
            }

            # Add sensitive data only if it's the user's own profile
            if is_own_profile:
                user_data.update(
                    {
                        "email": user.email,
                        "two_factor_enabled": user.two_factor_enabled,
                        "telephone_number": user.telephone_number,
                    }
                )

            try:
                player = user.player
                user_data["stats"] = {
                    "wins": player.wins,
                    "losses": player.losses,
                    "win_ratio": player.win_ratio(),
                    "display_name": player.get_display_name,
                }

                # Get recent matches
                recent_matches = []
                player_stats = player.playergamestats_set.select_related("single_game", "tournament_game").order_by(
                    "-joined_at"
                )[:5]

                for stat in player_stats:
                    game = stat.single_game or stat.tournament_game  # Handle both game types
                    if game:
                        match_data = {
                            "game_id": str(game.id),
                            "date": game.start_date,
                            "score": stat.score,
                            "won": game.winner == player if game.winner else None,
                            "game_type": "tournament" if hasattr(game, "tournament") else "single",
                            "opponent": None,
                        }

                        # Get opponent's stats
                        other_stat = game.playergamestats_set.exclude(player=player).select_related("player").first()

                        if other_stat:
                            match_data["opponent"] = {
                                "username": other_stat.player.username,
                                "display_name": other_stat.player.get_display_name,
                                "score": other_stat.score,
                            }

                        recent_matches.append(match_data)

                user_data["recent_matches"] = recent_matches

            except Player.DoesNotExist:
                logger.warning(f"Player profile not found for user {user.username}")
                user_data["stats"] = None
                user_data["recent_matches"] = []

            logger.debug(f"Returning profile data for user {user.username}, own profile: {is_own_profile}")
            return JsonResponse(user_data)

        except CustomUser.DoesNotExist:
            logger.warning(f"User not found with ID: {user_id}")
            return JsonResponse({"error": "User not found"}, status=404)
        except Exception as e:
            logger.error(f"Error fetching user profile: {str(e)}")
            return JsonResponse({"error": "Failed to fetch user profile"}, status=500)

    def patch(self, request, user_id):
        """Update user details (besides avatar)"""
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=401)

        if str(request.user.id) != str(user_id):
            return JsonResponse({"error": "Cannot update other users' profiles"}, status=403)

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        try:
            data = json.loads(request.body)

            print(
                "Before update:",
                {
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "bio": user.bio,
                    "telephone_number": user.telephone_number,
                    "pronoun": user.pronoun,
                },
            )

            # Fields that can be updated
            updatable_fields = {
                "username",
                "first_name",
                "last_name",
                "email",
                "bio",
                "telephone_number",
                "pronoun",
                "visibility_online_status",
                "visibility_user_profile",
                "two_factor_enabled",
            }

            # Update fields if they exist in the request
            for field in updatable_fields:
                if field in data:
                    setattr(user, field, data[field])

            user.save()

            print(
                "After update:",
                {
                    "username": user.username,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "bio": user.bio,
                    "telephone_number": user.telephone_number,
                    "pronoun": user.pronoun,
                    "two_factor_enabled": user.two_factor_enabled,
                },
            )

            # Return updated user data
            player = user.player
            user_data = {
                "id": str(user.id),
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
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
            print("Error updating user:", str(e))
            return JsonResponse({"error": str(e)}, status=400)


@method_decorator(csrf_exempt, name="dispatch")
class UserAvatarView(View):
    """Handle user avatar uploads"""

    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/jpg"]

    MAX_AVATAR_SIZE = 2 * 1024 * 1024  # 2MB in bytes

    def post(self, request, user_id):
        """Upload a new avatar"""
        if not request.user.is_authenticated:
            return JsonResponse({"error": "Not authenticated"}, status=401)

        if str(request.user.id) != str(user_id):
            return JsonResponse({"error": "Cannot update other users' avatars"}, status=403)

        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        if "avatar" not in request.FILES:
            return JsonResponse({"error": "No avatar file provided"}, status=400)

        avatar_file = request.FILES["avatar"]
        # Validate file type
        if avatar_file.content_type not in self.ALLOWED_TYPES:
            return JsonResponse(
                {"error": f"Invalid file type. Allowed types: {', '.join(self.ALLOWED_TYPES)}"}, status=400
            )

        # Validate file size
        if avatar_file.size > self.MAX_AVATAR_SIZE:
            return JsonResponse({"error": f"Avatar size exceeds the limit of {self.MAX_AVATAR_SIZE} bytes"}, status=400)

        # Add debug logging
        logger.debug(f"Saving avatar to: {settings.MEDIA_ROOT}")
        logger.debug(f"File name: {avatar_file.name}")

        # Save the new avatar
        user.avatar = avatar_file
        user.save()
        logger.debug(f"Saved avatar path: {user.avatar.path}")
        logger.debug(f"Saved avatar URL: {user.avatar.url}")

        return JsonResponse({"message": "Avatar updated successfully", "avatar": user.avatar.url})


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
