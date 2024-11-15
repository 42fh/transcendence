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
    """View for listing users with pagination and search functionality"""

    def get(self, request):
        search = request.GET.get("search", "")
        page = int(request.GET.get("page", 1))
        per_page = int(request.GET.get("per_page", 10))

        # Filter users by username or email
        users = CustomUser.objects.filter(Q(username__icontains=search) | Q(email__icontains=search))

        # Calculate pagination
        start = (page - 1) * per_page
        end = start + per_page
        total_users = users.count()
        users_page = users[start:end]

        # Build response with additional fields
        users_data = []
        for user in users_page:
            try:
                player = user.player  # Get associated Player instance

                # Get recent matches (both single and tournament games)
                recent_matches = []
                player_stats = player.playergamestats_set.select_related("single_game", "tournament_game").order_by(
                    "-joined_at"
                )[
                    :5
                ]  # Get last 5 matches

                for stat in player_stats:
                    game = stat.game  # This uses the property we defined in PlayerGameStats
                    if game:
                        match_data = {
                            "game_id": str(game.id),
                            "date": game.start_date,
                            "score": stat.score,
                            "won": game.winner == player if game.winner else None,
                            "game_type": "tournament" if stat.tournament_game else "single",
                            "opponent": None,  # We'll set this next
                        }

                        # Get opponent (for 2-player games)
                        other_stat = game.playergamestats_set.exclude(player=player).first()
                        if other_stat:
                            match_data["opponent"] = {
                                "username": other_stat.player.username,
                                "display_name": other_stat.player.get_display_name,
                                "score": other_stat.score,
                            }

                        recent_matches.append(match_data)

                user_data = {
                    "id": str(user.id),  # Convert UUID to string
                    "username": user.username,
                    "email": user.email,
                    "avatar": user.avatar.url if user.avatar else None,
                    "bio": user.bio,
                    "telephone_number": user.telephone_number,
                    "pronoun": user.pronoun,
                    "is_active": user.is_active,
                    "visibility_online_status": user.visibility_online_status,
                    "visibility_user_profile": user.visibility_user_profile,
                    # Game stats from Player model
                    "stats": {
                        "wins": player.wins,
                        "losses": player.losses,
                        "win_ratio": player.win_ratio(),
                        "display_name": player.get_display_name,
                    },
                    "recent_matches": recent_matches,
                }
                users_data.append(user_data)
            except Player.DoesNotExist:
                continue

        return JsonResponse(
            {
                "users": users_data,
                "pagination": {
                    "total": total_users,
                    "page": page,
                    "per_page": per_page,
                    "total_pages": (total_users + per_page - 1) // per_page,
                },
            }
        )
