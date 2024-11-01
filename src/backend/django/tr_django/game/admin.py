from django.contrib import admin
from .models import SingleGame, TournamentGame, GameMode

# Register your models here.
admin.site.register(SingleGame)
admin.site.register(TournamentGame)
admin.site.register(GameMode)
