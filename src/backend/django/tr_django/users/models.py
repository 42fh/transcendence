import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from datetime import timedelta


class CustomUser(AbstractUser):
    """
    The CustomUser model extends Django's AbstractUser with additional fields for the user app.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # Optional email field for now, but it could be made mandatory later.
    # When making it mandatory, remove `null=True` and `blank=True`.
    email = models.EmailField(
        unique=True,
        null=True,
        blank=True,
        error_messages={
            "unique": "A user with that email already exists.",
        },
    )
    email_verified = models.BooleanField(default=False)  # Verification status

    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    telephone_number = models.CharField(max_length=20, null=True, blank=True)
    pronoun = models.CharField(max_length=20, null=True, blank=True)

    # 2FA and JWT Fields for CustomUser Model // TODO: check this with Jonathan
    # Note: The fields will not be necessary if using libraries such as SimpleJWT for JWT authentication and django-two-factor-auth for 2FA.
    # These libraries handle token management, refresh tokens, and 2FA data storage internally,

    # Field to enable or disable 2FA for the user.
    two_factor_enabled = models.BooleanField(default=False)

    # Stores the user's secret key for generating 2FA codes,
    # typically used in TOTP (Time-based One-Time Password) algorithms.
    # This key is unique to the user and is used to create time-based codes.
    two_factor_secret = models.CharField(max_length=32, null=True, blank=True)

    # JSON field to store backup codes, which are single-use codes
    # the user can use to access their account if they cannot access
    # their primary 2FA method (like an authenticator app).
    backup_codes = models.JSONField(null=True, blank=True)

    # Stores the last successful 2FA code used, allowing the system to check
    # if a code has already been used (preventing replay attacks).
    # This helps ensure each 2FA code can only be used once.
    last_2fa_code = models.CharField(max_length=6, null=True, blank=True)

    # Tracks the last time a JWT was issued for this user.
    # This is useful if you want to invalidate all previously issued tokens
    # when a specific event occurs, like a password change.
    last_token_issued_at = models.DateTimeField(null=True, blank=True)

    # Stores a hashed version of the user's refresh token.
    # Refresh tokens allow the user to get a new access token after the
    # initial one expires, without needing to re-authenticate. This field
    # stores a secure hash of the refresh token for validation when the user
    # requests a new access token. Keeping the hash instead of the raw token
    # ensures that sensitive data is not stored directly in the database.
    refresh_token_hash = models.CharField(max_length=64, null=True, blank=True)

    # Status fields

    STATUS_OFFLINE = "offline"
    STATUS_ONLINE = "online"
    STATUS_BUSY = "busy"
    STATUS_AWAY = "away"

    ONLINE_STATUS_CHOICES = [
        (status, status.capitalize())
        for status in [STATUS_OFFLINE, STATUS_ONLINE, STATUS_BUSY, STATUS_AWAY]
    ]
    online_status = models.CharField(
        max_length=10, choices=ONLINE_STATUS_CHOICES, default=STATUS_OFFLINE
    )

    default_status = models.CharField(
        max_length=10,
        choices=[
            (STATUS_OFFLINE, STATUS_OFFLINE.capitalize()),
            (STATUS_AWAY, STATUS_AWAY.capitalize()),
        ],
        default=STATUS_OFFLINE,
    )

    VISIBILITY_NONE = "none"
    VISIBILITY_FRIENDS = "friends"
    VISIBILITY_EVERYONE = "everyone"
    VISIBILITY_CUSTOM = "custom"

    VISIBILITY_CHOICES = [
        (visibility, visibility.capitalize())
        for visibility in [
            VISIBILITY_NONE,
            VISIBILITY_FRIENDS,
            VISIBILITY_EVERYONE,
            VISIBILITY_CUSTOM,
        ]
    ]
    visibility_online_status = models.CharField(
        max_length=10, choices=VISIBILITY_CHOICES, default=VISIBILITY_FRIENDS
    )

    visibility_user_profile = models.CharField(
        max_length=10, choices=VISIBILITY_CHOICES, default=VISIBILITY_EVERYONE
    )

    custom_visibility_group = models.ForeignKey(
        to="users.VisibilityGroup",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users_with_custom_visibility",
    )

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="custom_user_set",
        blank=True,
        verbose_name="groups",
        help_text="The groups this user belongs to.",
    )

    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="custom_user_set",
        blank=True,
        verbose_name="user permissions",
        help_text="Specific permissions for this user.",
    )

    # Friendship and Blocking
    friends = models.ManyToManyField("self", blank=True, symmetrical=True)
    blocked_users = models.ManyToManyField(
        "self", blank=True, symmetrical=False, related_name="blocked_by"
    )

    # Friend Request System
    friend_requests_sent = models.ManyToManyField(
        "self", blank=True, symmetrical=False, related_name="friend_requests_received"
    )

    def send_friend_request(self, user):
        """Sends a friend request to another user."""
        if user != self and not self.is_friend_with(user):
            if self.is_blocked_by(user) or user in self.blocked_users.all():
                raise ValueError("Cannot send friend request to/from blocked user")
            self.friend_requests_sent.add(user)

    def accept_friend_request(self, user):
        """Accepts a friend request from another user."""
        if user in self.friend_requests_received.all():
            self.friend_requests_received.remove(user)
            self.friends.add(user)
            if user in self.friend_requests_sent.all():
                self.friend_requests_sent.remove(user)

    def reject_friend_request(self, user):
        """Rejects a friend request from another user."""
        if user in self.friend_requests_received.all():
            self.friend_requests_received.remove(user)

    def cancel_friend_request(self, user):
        """Cancels a friend request sent to another user."""
        if user in self.friend_requests_sent.all():
            self.friend_requests_sent.remove(user)

    def is_friend_with(self, user) -> bool:
        return self.friends.filter(id=user.id).exists()

    def is_blocked_by(self, user) -> bool:
        return user.blocked_users.filter(id=self.id).exists()

    def __str__(self):
        return str(self.username)


class VisibilityGroup(models.Model):
    """
    Model to manage custom visibility groups for users
    """

    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(
        "CustomUser", on_delete=models.CASCADE, related_name="created_visibility_groups"
    )
    members = models.ManyToManyField(
        "CustomUser", related_name="visibility_group_memberships", blank=True
    )

    def __str__(self):
        return self.name


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="verification_tokens"
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        default=timezone.now() + timedelta(days=1)
    )  # 1-day expiry

    def is_expired(self):
        return timezone.now() > self.expires_at


class PasswordResetToken(models.Model):
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="password_reset_tokens"
    )
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        default=timezone.now() + timedelta(hours=1)
    )  # 1-hour expiry

    def is_expired(self):
        return timezone.now() > self.expires_at
