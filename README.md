# MOB
# start frontend
cd frontend
npm run start
# start backend
cd backend
source .venv/bin/activate
python manage.py collectstatic
daphne -b 0.0.0.0 -p 8000 mob_backend.asgi:application
redis-server
