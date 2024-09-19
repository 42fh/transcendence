#from django.shortcuts import render
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Paddle
from .serializers import PaddleSerializer

class PaddleMoveView(APIView):
    def post(self, request, paddle_id, format=None):  # Use paddle_id here
        try:
            paddle = Paddle.objects.get(id=paddle_id)  # Use paddle_id to get the paddle
        except Paddle.DoesNotExist:
            return Response({'error': 'Paddle not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Validate and update position
        serializer = PaddleSerializer(paddle, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
