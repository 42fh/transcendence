# Use the official Python image
FROM python:3.12-slim

# Set environment variables to prevent bytecode creation and buffer outputs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Copy the requirements.txt from the backend directory
COPY requirements.txt /app/

# Install dependencies before copying the rest of the project
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the entire project directory to the container
COPY . /app/

# Generic fallback if Docker Compose doesn't override the command
CMD ["sh", "-c", "echo 'Strange! This should not have run!'"]
