
---

# Useful Commands related to Django

## Installation and setup

### 1. Start the Development Server
To start the development server, navigate to your project directory (`/django` in this case) and run:
```bash
python manage.py runserver
```
`django-admin` command is the main administrative interface for Django. It provides a set of commands to perform tasks in Django projects (creating new applications, migrating databases...) `manage.py` is a wrapper script that provides the same commands as `django-admin`, but with the added benefit of automatically setting the environment and the settings module for your specific project.

### 2. Create a New Django App
```bash
python manage.py startapp <name_of_the_app>
```

Then add it to your project settings: open `project/settings.py` and Add `'name_of_the_app'` to the `INSTALLED_APPS` list.

*The Django framework is designed for backend development, enabling the creation of applications that generate web pages. In contrast, Django REST Framework is an API that provides server data to frontend applications, allowing them to operate without needing to consider the backend.*### To Install Django REST Framework (DRF)
### To Install Django REST Framework (DRF)

```bash
pip install djangorestframework
```

Then, add it to the `INSTALLED_APPS` list in `settings.py`:

```python
INSTALLED_APPS = [
    ...
    'rest_framework',
]
```


## DB management

Migrations are files that contain the instructions to change the database schema.
Migrations automate the process of updating the database schema based on code changes, reducing the risk of manual errors.

Each migration file has a unique name, often including a timestamp, and contains a class that defines the changes to be made to the database.
It can help keep track of how a project evolved
 - Migrations can also be reversed, allowing  to undo changes if necessary (version control)


This will generate the necessary migration files:
```bash
python manage.py makemigrations game
```

Apply Migrations: After creating the migration files, apply them to your database with:
```bash
python manage.py migrate
```python manage.py runserver  

   Start Django shell:
   ```bash
   python manage.py shell
   ```

### Example:
  list all paddles in the database
  ```python
   from game.models import Paddle
   Paddle.objects.all() 
   ```
   If there are no paddles, you can create one in the Django shell:
   ```python
   paddle = Paddle.objects.create(position_y=0.0, height=100.0, width=10.0)
   print(paddle.id)  
   ```




## Overall commands to test a Django project:

   ```bash
cd django
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations game
python manage.py migrate

python manage.py shell
from game.models import Paddle
paddle = Paddle.objects.create(position_y=0.0, height=100.0, width=10.0)
exit()

python manage.py runserver  
   ```

