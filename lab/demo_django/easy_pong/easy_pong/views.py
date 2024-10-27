from django.http import HttpResponse
from django.shortcuts import render


def root_page(request):
    return HttpResponse(
        "<h1>Welcome to Easy Pong</h1>"
        "<p><a href='/helloapp/'>Go to Hello App</a></p>"
    )
