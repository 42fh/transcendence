from django.shortcuts import render
from django.http import JsonResponse
from django.http import HttpResponse
import random

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt

def index(request):
    return render(request, "index.html")    

def greeting(request):
    words = ["hi", "hey", "hallo", "salu", "säli", "tschou", "grüezi", "tagwohl", "tach", "buongiorno", "ciao", "bonjour"]
    greeting = random.choice(words)
    response = JsonResponse({"greeting" : greeting})
    response['Access-Control-Allow-Origin'] = '*'
    response['Content-Security-Policy'] = "default-src '*'"
    return response

def page(request):
    return render(request, template_name="index.html", context=None)

def my_page(request):
    if request.user.is_authenticated :
        return HttpResponse("Welcome " + str(request.user) + "!")
    else:
        return HttpResponse("not logged in")

def get_csrf_token(request):
    csrf_token = get_token(request)
    return HttpResponse(csrf_token)

def my_login(request):
    if request.user.is_authenticated:
        return HttpResponse("Already logged in!")
    else:
        username = request.POST.get('username', 'nousernameprovided')
        password = request.POST.get('password', '638592932658837546')
        print(username, password)
        user = authenticate(request, username=username, password=password)
        # user = authenticate(request=request)
        if user is not None:
            login(request, user)
            return HttpResponse("Welcome " + str(user) + "!")
        else:
            csrf_token = get_token(request)
            res = HttpResponse(    
"""
<!DOCTYPE html>
<html>
<body>

<form action="/login" method="POST">
  <label for="username">user:</label><br>
  <input type="text" id="username" name="username" value="jack"><br>
  <label for="password">password:</label><br>
  <input type="text" id="password" name="password" value="12345678"><br><br>
  <label for="csrfmiddlewaretoken">csrfmiddlewaretoken:</label><br>
  <input type="text" id="csrfmiddlewaretoken" name="csrfmiddlewaretoken" value=""><br><br>
  <input type="submit" value="Submit">
</form> 

</body>
</html>
"""
            )
            res.set_cookie('csrftoken', csrf_token)
            return res