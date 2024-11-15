from .settings import *

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# Make sure to use the CustomUser model
AUTH_USER_MODEL = "users.CustomUser"
