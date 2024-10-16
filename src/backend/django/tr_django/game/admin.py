from django.contrib import admin
from .models import Player, Game, GameMode

# Register your models here.
admin.site.register(Player)
admin.site.register(Game)
admin.site.register(GameMode)
