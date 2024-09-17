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