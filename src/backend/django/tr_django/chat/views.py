# views.py
from django.shortcuts import render, redirect
from django.http import JsonResponse, HttpResponse
from django.contrib.auth.decorators import login_required

@login_required
def chatPage(request, *args, **kwargs):
    if not request.user.is_authenticated:
        return redirect("login-user")
    context = {}
    return render(request, "chatPage.html", context)

def testPage(request):
    return HttpResponse("test page for chats")

@login_required
def create_one_to_one_chat(request):
    if request.method == 'POST':
        other_user = request.POST.get('other_user')
        # return a URL for the chat room
        chat_room_url = f"/chat/{request.user.username}_{other_user}/"
        return JsonResponse({'chat_room_url': chat_room_url})
    return JsonResponse({'error': 'Invalid request'}, status=400)

@login_required
def one_to_one_chat(request, room_name):
    context = {
        'room_name': room_name,
    }
    return render(request, 'one_to_one_chat.html', context)
