# Use Nginx base image
FROM nginx:1.26.1

# Set an ARG to specify environment (optional but useful)
ARG ENVIRONMENT

# Copy the appropriate configuration file based on the environment
COPY nginx/${ENVIRONMENT}.conf /etc/nginx/conf.d/default.conf

# Copy frontend build files to the Nginx directory
COPY /frontend/ /usr/share/nginx/html
