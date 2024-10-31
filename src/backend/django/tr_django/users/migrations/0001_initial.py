# Generated by Django 5.1.2 on 2024-10-31 14:36

import django.contrib.auth.models
import django.contrib.auth.validators
import django.db.models.deletion
import django.utils.timezone
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="CustomUser",
            fields=[
                ("password", models.CharField(max_length=128, verbose_name="password")),
                (
                    "last_login",
                    models.DateTimeField(
                        blank=True, null=True, verbose_name="last login"
                    ),
                ),
                (
                    "is_superuser",
                    models.BooleanField(
                        default=False,
                        help_text="Designates that this user has all permissions without explicitly assigning them.",
                        verbose_name="superuser status",
                    ),
                ),
                (
                    "username",
                    models.CharField(
                        error_messages={
                            "unique": "A user with that username already exists."
                        },
                        help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.",
                        max_length=150,
                        unique=True,
                        validators=[
                            django.contrib.auth.validators.UnicodeUsernameValidator()
                        ],
                        verbose_name="username",
                    ),
                ),
                (
                    "first_name",
                    models.CharField(
                        blank=True, max_length=150, verbose_name="first name"
                    ),
                ),
                (
                    "last_name",
                    models.CharField(
                        blank=True, max_length=150, verbose_name="last name"
                    ),
                ),
                (
                    "email",
                    models.EmailField(
                        blank=True, max_length=254, verbose_name="email address"
                    ),
                ),
                (
                    "is_staff",
                    models.BooleanField(
                        default=False,
                        help_text="Designates whether the user can log into this admin site.",
                        verbose_name="staff status",
                    ),
                ),
                (
                    "is_active",
                    models.BooleanField(
                        default=True,
                        help_text="Designates whether this user should be treated as active. Unselect this instead of deleting accounts.",
                        verbose_name="active",
                    ),
                ),
                (
                    "date_joined",
                    models.DateTimeField(
                        default=django.utils.timezone.now, verbose_name="date joined"
                    ),
                ),
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "avatar",
                    models.ImageField(blank=True, null=True, upload_to="avatars/"),
                ),
                ("bio", models.TextField(blank=True, null=True)),
                (
                    "telephone_number",
                    models.CharField(blank=True, max_length=20, null=True),
                ),
                ("pronoun", models.CharField(blank=True, max_length=20, null=True)),
                (
                    "online_status",
                    models.CharField(
                        choices=[
                            ("offline", "Offline"),
                            ("online", "Online"),
                            ("busy", "Busy"),
                            ("away", "Away"),
                        ],
                        default="offline",
                        max_length=10,
                    ),
                ),
                (
                    "default_status",
                    models.CharField(
                        choices=[("offline", "Offline"), ("away", "Away")],
                        default="offline",
                        max_length=10,
                    ),
                ),
                (
                    "visibility_online_status",
                    models.CharField(
                        choices=[
                            ("none", "None"),
                            ("friends", "Friends"),
                            ("everyone", "Everyone"),
                            ("custom", "Custom"),
                        ],
                        default="friends",
                        max_length=10,
                    ),
                ),
                (
                    "visibility_user_profile",
                    models.CharField(
                        choices=[
                            ("none", "None"),
                            ("friends", "Friends"),
                            ("everyone", "Everyone"),
                            ("custom", "Custom"),
                        ],
                        default="everyone",
                        max_length=10,
                    ),
                ),
                (
                    "blocked_users",
                    models.ManyToManyField(
                        blank=True, related_name="blocked_by", to="users.customuser"
                    ),
                ),
                (
                    "friends",
                    models.ManyToManyField(
                        blank=True, related_name="friends_of", to="users.customuser"
                    ),
                ),
                (
                    "groups",
                    models.ManyToManyField(
                        blank=True,
                        help_text="The groups this user belongs to.",
                        related_name="custom_user_set",
                        to="auth.group",
                        verbose_name="groups",
                    ),
                ),
                (
                    "user_permissions",
                    models.ManyToManyField(
                        blank=True,
                        help_text="Specific permissions for this user.",
                        related_name="custom_user_set",
                        to="auth.permission",
                        verbose_name="user permissions",
                    ),
                ),
            ],
            options={
                "verbose_name": "user",
                "verbose_name_plural": "users",
                "abstract": False,
            },
            managers=[
                ("objects", django.contrib.auth.models.UserManager()),
            ],
        ),
        migrations.CreateModel(
            name="VisibilityGroup",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("name", models.CharField(max_length=100)),
                ("description", models.TextField(blank=True, null=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="created_visibility_groups",
                        to="users.customuser",
                    ),
                ),
                (
                    "members",
                    models.ManyToManyField(
                        blank=True,
                        related_name="visibility_group_memberships",
                        to="users.customuser",
                    ),
                ),
            ],
        ),
        migrations.AddField(
            model_name="customuser",
            name="custom_visibility_group",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="users_with_custom_visibility",
                to="users.visibilitygroup",
            ),
        ),
    ]
