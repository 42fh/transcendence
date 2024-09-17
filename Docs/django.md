# Introduction to Django

Django is a high-level Python web framework that encourages rapid development.

Below is an introductory guide to some of Django’s core concepts:

---

## 1. **Apps**
In Django, a web project is split into smaller modules called **apps**. Each app is designed to handle a specific aspect of your web application (e.g., authentication, blog, store). A Django project can have multiple apps, which makes it scalable and maintainable.

### Key Characteristics:
- **Modularity:** Apps are self-contained units.
- **Reusability:** Apps can be reused across projects.
- **Separation of concerns:** Each app handles a different functionality.

#### Creating an App:
You can create an app using the following command:
```bash
python manage.py startapp <app_name>
```

### Structure of Django Apps

 - Overkill separation of apps:
1. `users` – Handles user registration, login, profiles, stats.
2. `chat` – Manages real-time messaging between users.
3. `pong_game` – Server-side logic for the Pong game.
4. `x_game` – Server-side logic for the second game.
5. `leaderboard` – Maintains and displays leaderboards.
6. `api` – Provides API endpoints for games, chat, and users.
7. `matchmaking` – Handles user matchmaking for multiplayer games (reusable across games)
8. `notifications` – Sends real-time alerts and notifications to users.

Alex recommends not splitting into several apps: not at the beginning, not for a small startup:  
[Source](https://alexkrupp.typepad.com/sensemaking/2021/06/django-for-startup-founders-a-better-software-architecture-for-saas-startups-and-consumer-apps.html#rule5)

I also read on the internet:

> "If two models require each other, they go in the same app. If they don't, then separate apps."

There is probably a middle ground to be found.

[Django apps are Django specific python packages](https://djangopackages.org/categories/apps/)
---

## 2. **Views**
Views in Django are responsible for processing user requests and returning the appropriate responses. They are typically tied to URLs.

### Types of Views:
- **Function-based Views (FBVs):** Simple Python functions that take a request and return a response.
- **Class-based Views (CBVs):** Object-oriented views that offer more structure and flexibility.

#### Example (FBV):
```python
from django.http import HttpResponse

def index(request):
    return HttpResponse("Hello, world!")
```

#### Example (CBV):
```python
from django.views import View
from django.http import HttpResponse

class IndexView(View):
    def get(self, request):
        return HttpResponse("Hello, world!")
```

---

## 3. **URL Patterns**
Django uses a powerful URL routing system to map URLs to views. Each URL pattern is a string or regular expression that Django matches against incoming requests to call the corresponding view.

#### Example of URL patterns:
```python
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
]
```

In this example, the root URL (`''`) is mapped to the `index` view.

---

## 4. **Model vs DB**
Django models define the structure of your application’s database tables. Django’s ORM (Object Relational Mapper) allows you to interact with the database using Python code instead of SQL.
We have to chose wether to use a Postgres DB or use a Django native model

### Pros of Django Models:
- **Easy to Use:** Simplifies database operations through Python classes and methods.
- **Database Abstraction:** Works with multiple database backends (e.g., SQLite, PostgreSQL, MySQL).
- **Auto Migrations:** Django handles database schema changes automatically.

### Cons of Django Models:
- **Overhead:** The ORM can introduce overhead compared to raw SQL, especially in complex queries.
- **Customization Limits:** Fine-tuned control of database queries may require bypassing the ORM in favor of raw SQL.

#### PostgreSQL Integration:
PostgreSQL is a powerful, open-source relational database management system supported by Django. It offers advanced features like JSON support, full-text search, and various index types that can enhance the performance and capabilities of your application.

### Pros of PostgreSQL:
- **Advanced Features:** Supports rich data types (JSON, array fields).
- **Performance:** Optimized for large-scale applications and complex queries.
- **Security and Reliability:** Provides ACID compliance and advanced security features.

### Cons of PostgreSQL:
- **Setup Complexity:** Requires more configuration compared to simpler databases like SQLite.
- **Heavier Resource Use:** Requires more system resources for operation.

#### Example Model:
```python
from django.db import models

class Book(models.Model):
    title = models.CharField(max_length=100)
    author = models.CharField(max_length=100)
    published_date = models.DateField()

    def __str__(self):
        return self.title
```

---

## 5. **Commands**
Django comes with a built-in command-line utility called `manage.py` to interact with your Django project. Common commands include:

- **`python manage.py runserver`**: Runs the local development server.
- **`python manage.py makemigrations`**: Prepares the database migrations based on model changes.
- **`python manage.py migrate`**: Applies migrations to the database.
- **`python manage.py createsuperuser`**: Creates an admin user.

You can also create custom management commands by creating a `management/commands` directory in one of your apps and adding a Python script for your command.

---

## 6. **Signals and Event Listeners**
Django’s signal framework allows decoupled components to get notified when certain actions happen within the application, such as when a model is saved or a user logs in. 

### Common Signals:
- **`pre_save`**: Triggered before a model’s `save()` method is called.
- **`post_save`**: Triggered after a model’s `save()` method is called.
- **`pre_delete`**: Triggered before a model is deleted.
- **`post_delete`**: Triggered after a model is deleted.

#### Example Signal:
```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Book

@receiver(post_save, sender=Book)
def notify_admin(sender, instance, **kwargs):
    print(f'Book "{instance.title}" was saved!')
```

In this example, the `notify_admin` function will run whenever a `Book` instance is saved.

---

## 7. **Django Rest Framework (DRF)**
The **Django Rest Framework (DRF)** is a powerful and flexible toolkit for building Web APIs. It makes it easy to convert Django models into RESTful APIs, providing built-in support for:
- Serialization of models into JSON.
- Authentication, permissions, and throttling.
- Class-based views to structure API endpoints.
- Browsable API for easy testing during development.

### Example of a Simple API:
#### Serializer:
```python
from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = '__all__'
```

#### View (API):
```python
from rest_framework import generics
from .models import Book
from .serializers import BookSerializer

class BookListCreateView(generics.ListCreateAPIView):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
```

#### URL:
```python
from django.urls import path
from .views import BookListCreateView

urlpatterns = [
    path('books/', BookListCreateView.as_view(), name='book-list'),
]
```

In this example, the `BookListCreateView` provides an API endpoint for listing and creating books.

---

## Summary
- **Apps** are modular components of a Django project.
- **Views** handle the logic for returning responses to user requests.
- **URL patterns** map URLs to views.
- **Models** represent database tables and can work with databases like PostgreSQL.
- **Commands** provide interaction with the Django project through the command line.
- **Signals** enable decoupled communication between different parts of the application.
- **Django Rest Framework** allows the building of RESTful APIs efficiently and elegantly.

With these concepts, Django provides a powerful yet easy-to-use framework for building scalable and maintainable web applications.



## Ressources:
[Official documentation](https://docs.djangoproject.com/en/5.1/)
[Alex Krupp, Django for Startup Founders: A Better Software Architecture for SaaS Startups and Consumer Apps](https://alexkrupp.typepad.com/sensemaking/2021/06/django-for-startup-founders-a-better-software-architecture-for-saas-startups-and-consumer-apps.html)

https://www.youtube.com/watch?v=cJveiktaOSQ&t=1s&ab_channel=DennisIvy
https://www.youtube.com/watch?v=nGIg40xs9e4&ab_channel=TechWithTim
