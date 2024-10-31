from django.contrib import admin
from .models import SingleGame, DirectEliminationTournamentGame, GameMode

# Register your models here.
admin.site.register(SingleGame)
admin.site.register(DirectEliminationTournamentGame)
admin.site.register(GameMode)
