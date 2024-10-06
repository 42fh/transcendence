export SECRET_KEY=12345
export DJANGO_SETTINGS_MODULE=pong.settings
. /home/ubuntu/transcendence/.venv/bin/activate
daphne -e ssl:443:privateKey=/etc/letsencrypt/live/t.000031.xyz/privkey.pem:certKey=/etc/letsencrypt/live/t.000031.xyz/cert.pem pong.asgi:application 