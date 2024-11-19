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
    def post(self, request):
        if not request.user.is_authenticated:
            return JsonResponse({"success": False, "message": "User not authenticated."}, status=401)

        request.user.is_active = False
        request.user.save()
        logout(request)

        return JsonResponse({"success": True, "message": "User account deactivated."})


@method_decorator(csrf_exempt, name="dispatch")
class UserListView(View):
    """View for listing users with basic information"""

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
            return JsonResponse({"error": str(e)}, status=400)
