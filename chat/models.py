from django.db import models
from .models import CustomUser


class BlockedUser(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="chat_blocking")
    blocked_user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="chat_blocked_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "blocked_user")
        indexes = [
            models.Index(fields=["user", "blocked_user"]),
        ]

    def __str__(self):
        return f"{self.user.username} blocked {self.blocked_user.username}"
