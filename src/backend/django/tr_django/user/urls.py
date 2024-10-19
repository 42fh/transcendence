from django.urls import path
from .views import user_profile

urlpatterns = [
    path('user/<str:username>/', user_profile, name='user_profile'),
	# path('user(<str:username>)/', user_profile, name='user_profile'),
]