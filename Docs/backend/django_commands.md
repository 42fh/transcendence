Here’s a more polished and clear version of the commands:

---

## Useful Django Commands

### 1. Start the Development Server
To start the development server, navigate to your project directory (`/tr_backend` in this case) and run:

```bash
python manage.py runserver
```

### 2. Create a New Django App
```bash
python manage.py startapp <name_of_the_app>
```

Then add it to your project settings: open `project/settings.py` and Add `'name_of_the_app'` to the `INSTALLED_APPS` list.

### 3. Install Django REST Framework (DRF)
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







python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations game
python manage.py migrate

   python manage.py shell
from game.models import Paddle
paddle = Paddle.objects.create(position_y=0.0, height=100.0, width=10.0)

python manage.py runserver  






   Start Django shell:
   ```bash
   python manage.py shell
   ```

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

Execute `curl` command  to change position (this is for a paddle with default id 1)

   ```bash
   curl -X POST http://127.0.0.1:8000/api/match/1/move/ \
        -H "Content-Type: application/json" \
        -d '{"position_y": 150.0}'
   ```


   curl Command to Get Paddle Position
   Replace <paddle_id> with the ID of the paddle you want to retrieve:

   ```bash
   curl -X GET http://127.0.0.1:8000/api/match/1/move/
   ```







Make Migrations: 

This will generate the necessary migration files for your Paddle model.
```bash
python manage.py makemigrations game
```

Apply Migrations: After creating the migration files, apply them to your database with:
```bash
python manage.py migrate
```python manage.py runserver  