from rest_framework import serializers
from .models import Paddle

class PaddleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paddle
        fields = ['id', 'position_y', 'height', 'width']
