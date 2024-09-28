from django.shortcuts import render
from django.http import JsonResponse
import random

def index(request):
    words = ["hi", "hey", "hallo", "salu", "säli", "tschou", "grüezi", "tagwohl", "tach", "buongiorno", "ciao", "bonjour"]
    greeting = random.choice(words)
    response = JsonResponse({"greeting" : greeting})
    response['Access-Control-Allow-Origin'] = '*'
    return response

def page(request):
    return render(request, template_name="index.html", context=None)