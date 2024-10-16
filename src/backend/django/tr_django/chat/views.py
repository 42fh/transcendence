from django.shortcuts import render, redirect
from django.http import HttpResponse


def chatPage(request, *args, **kwargs):
    if not request.user.is_authenticated:
        return redirect("login-user")
    context = {}
    return render(request, "chatPage.html", context)

def testPage(request):
    return HttpResponse("test page for chats")
