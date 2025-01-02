# Use the official Python image
FROM python:3.13-slim

# Set environment variables to prevent bytecode creation and buffer outputs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Create media directories
RUN mkdir -p /app/media/avatars/users /app/media/avatars/default

# Install dependencies before copying the rest of the project to avoid rebuilds
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the entire project directory to the container
COPY . /app/

# Generic fallback if Docker Compose doesn't override the command
CMD ["sh", "-c", "echo 'Strange! This should not have run!'"]
