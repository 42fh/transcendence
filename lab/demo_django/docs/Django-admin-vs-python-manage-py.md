# **`django-admin <some command>` vs `python manage.py <some command>`**

### **1. Overview of `django-admin` and `manage.py`**

- **`django-admin`** is the **main command** of Django's CLI (Command Line Interface) and the **only global entry point** for interacting with Django through the command line.
- **`manage.py`** is a **project-specific wrapper** around `django-admin`. It automatically links the commands you run to your specific Django project by pre-loading the project’s settings and environment.

### **2. When to Use `django-admin`**

- **Before a project is created**:

  - When you don’t yet have a Django project (there's no `manage.py` file), you must use `django-admin` to set up the project.
  - The most common use of `django-admin` in this stage is to run:
    ```bash
    django-admin startproject <project_name>
    ```
  - This command sets up the initial project structure, including the `manage.py` script, which you will use from this point onward for most operations.

- **Global or project-independent tasks**:
  - You can also use `django-admin` for certain global tasks (e.g., running scripts outside the context of a specific project).
  - Once a project is set up, `django-admin` can still be used to manage the project, but you’ll need to explicitly specify the **settings file** to link it to the project:
    ```bash
    django-admin <subcommand> --settings=<project_name>.settings
    ```

### **3. When to Use `manage.py`**

- **After a project is created**:

  - Once you have created a project using `django-admin startproject`, you will typically switch to using **`python manage.py`** for managing the project because it’s simpler and more convenient.
  - **`manage.py`** knows about your project’s settings automatically, so you don’t have to manually specify them every time you run a command.

  Example of common commands:

  - **`runserver`**:
    ```bash
    python manage.py runserver
    ```
  - **`migrate`**:
    ```bash
    python manage.py migrate
    ```

- **Why Use `manage.py`?**
  - It automatically connects to your project’s settings and environment.
  - It wraps around `django-admin` but eliminates the need to pass the `--settings` argument manually.
  - **All commands available through `manage.py`** are actually the same as the subcommands of `django-admin`, but `manage.py` simplifies their use within a project.

### **4. Key Differences Between `django-admin` and `manage.py`**

- **`django-admin`**:

  - A **global command** provided by Django’s CLI.
  - Used for **setting up a project** before you have a `manage.py` file (e.g., `django-admin startproject`).
  - Can also be used to run commands inside a project, but you must explicitly pass the settings file:
    ```bash
    django-admin runserver --settings=myproject.settings
    ```

- **`manage.py`**:
  - A **project-specific Python script** generated when you create a Django project.
  - Automatically knows the **settings and environment** of your project, so you don’t need to manually specify the settings file.
  - Used for most project-specific tasks like running the development server, applying migrations, and creating apps.

### **5. Example Command Comparisons**

| **Action**                   | **With `django-admin`**                                      | **With `manage.py`**               |
| ---------------------------- | ------------------------------------------------------------ | ---------------------------------- |
| **Create a new project**     | `django-admin startproject easy_pong`                        | N/A (No `manage.py` exists yet)    |
| **Start development server** | `django-admin runserver --settings=myproject.settings`       | `python manage.py runserver`       |
| **Create a new app**         | `django-admin startapp game --settings=myproject.settings`   | `python manage.py startapp game`   |
| **Run migrations**           | `django-admin migrate --settings=myproject.settings`         | `python manage.py migrate`         |
| **Create a superuser**       | `django-admin createsuperuser --settings=myproject.settings` | `python manage.py createsuperuser` |
| **Open the Python shell**    | `django-admin shell --settings=myproject.settings`           | `python manage.py shell`           |

### **6. Summary of the Usage Flow**

1. **Starting a Project**:

   - Use `django-admin startproject` to create a new project, which generates the initial project files, including `manage.py`.

2. **Managing the Project**:

   - After the project is created, switch to using **`manage.py`** for everyday project tasks like running the server, migrating the database, creating apps, and managing users.

3. **Advanced Usage**:
   - If needed, you can still use `django-admin` within the project context by specifying the `--settings` argument, but **`manage.py` is typically preferred** for convenience.

### **7. Summary of Key Points**

- **`django-admin`** is the **main command** of Django’s CLI and is used globally.
  - Typically used to **start a project** and for project-independent tasks.
  - After a project is set up, you need to specify the `--settings` file to use it within a project.
- **`manage.py`** is a **project-specific wrapper** around `django-admin`.
  - Automatically loads your project’s settings, making it more convenient for **project-specific operations**.
  - Generally used for all project-related tasks once the project is initialized.

### **8. Key Subcommands for Both `django-admin` and `manage.py`**

- **`startproject`**: Create a new project (usually only used with `django-admin`).
- **`startapp`**: Create a new app within a project.
- **`runserver`**: Start the development server.
- **`migrate`**: Apply migrations to the database.
- **`makemigrations`**: Create new migrations based on changes to models.
- **`createsuperuser`**: Create an admin (superuser) account.
- **`shell`**: Open an interactive Python shell pre-loaded with your project’s environment.
