from django.shortcuts import render
from django.http import JsonResponse
from django.http import HttpResponse
import random
import time
import asyncio

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.middleware.csrf import get_token

# test for a global variable
import sometext.globalvar

# background task see https://stackoverflow.com/q/66809088/
from daphne.server import twisted_loop

# SO example
# heres a view that you want to start a background function in
# def hello_background(request):
#     twisted_loop.create_task(long_task())

def start_ball(request):
    # asyncio.run(sometext.globalvar.wiggle_ball())
    # asyncio.run(sometext.globalvar.update_game())
    # asyncio.create_task(sometext.globalvar.update_game())
    twisted_loop.create_task(sometext.globalvar.update_game())
    return HttpResponse("hi")

def all_games(request):
    games_string = "<br>".join([str(game) for game in sometext.globalvar.game_array])
    return HttpResponse(games_string)

def view_init_game(request):
    sometext.globalvar.init_games()
    return HttpResponse("init game done")

def view_add_game(request):
    sometext.globalvar.add_game()
    return HttpResponse("added game")

def get_jack_email(request):
    timestamp_before = time.time()
    jack = User.objects.get(id=2)
    email = jack.get_email_field_name()
    timestamp_after = time.time()
    time_delta = timestamp_after - timestamp_before
    return HttpResponse("email: " + email
        + " measured time delta in 'get_jack_email' was: " + str(time_delta) + "sec")

def delta_time(request):
    timestamp_before = time.time()
    print("function 'delta_time' was called")
    timestamp_after = time.time()
    time_delta = timestamp_after - timestamp_before
    return HttpResponse("measured time delta in 'delta_time' was: " + str(time_delta) + "sec")

def create_int(request):
    sometext.globalvar.createVar()
    return HttpResponse("global var created")

def next_int(request):
    sometext.globalvar.glob_int += 1
    return HttpResponse(str(sometext.globalvar.glob_int))

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