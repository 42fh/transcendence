#!/bin/bash

# Navigate to the repository directory
cd /srv/django_chat

# Ensure the repository is up to date
git pull origin main

# Bring down any existing containers
make down-prod

# Rebuild and start the full Docker environment (Django + Redis)
make up-prod

