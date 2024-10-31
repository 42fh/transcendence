from django.db import models


class Tournament(models.Model):
    type_choices = [
        ("single", "Single Elimination"),
        ("double", "Double Elimination"),
        ("round_robin", "Round Robin"),
        # Add any other tournament types you need
    ]

    type = models.CharField(max_length=20, choices=type_choices)
    # ... rest of the model fields ...
