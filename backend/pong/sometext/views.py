from django.shortcuts import render
from django.http import JsonResponse
from django.http import HttpResponse
import random

from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt

def index(request):
    response = HttpResponse("""

<link rel="icon" href="data:,">              
<html>welcome to index</html>
<script>
                            
var o = false;
w = new WebSocket("ws://localhost:8000/ws/a");
w.onopen = (() => o = true);
w.onmessage = (msg => {console.log(JSON.parse(msg.data))});

function main() {
    if (o) {
    w.send(JSON.stringify({"greeting": "hallo7"}));
    }
}

setInterval(main, 1000)

</script>

""")
    # response['Access-Control-Allow-Origin'] = '*'
    # response['Content-Security-Policy'] = "default-src 'self'"
    return response
    

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
        return HttpResponse("Ok, logged in!")
    else:
        return HttpResponse("not logged in")

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