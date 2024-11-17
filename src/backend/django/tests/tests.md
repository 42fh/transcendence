# API Testing

## Setting up Test Environment

1. Create and activate virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # Unix/MacOS
# or
.\venv\Scripts\activate  # Windows
```

2. Install requirements:

```bash
pip install -r requirements.txt
```

3. Run tests:

```bash
python -m pytest test_user_api.py -v
```

Note: Make sure the Django development server is running (`make up-dev`) before running the tests.

## User Endpoints

### List Users

curl http://localhost:8000/api/users/

### Get User Details

curl http://localhost:8000/api/users/dev/

### Get User Stats

curl http://localhost:8000/api/users/dev/stats/

### Get User Games

curl http://localhost:8000/api/users/dev/games/

### Get Famous Users

curl http://localhost:8000/api/users/ThePrimeagen/
curl http://localhost:8000/api/users/LexFridman/
curl http://localhost:8000/api/users/ElonMusk/
curl http://localhost:8000/api/users/CheGuevara/

## Expected Data

The test database should contain these users:

- dev (development user)

  - email: dev@example.com
  - password: dev
  - wins: 5, losses: 2

- ThePrimeagen

  - email: prime@vim.dev
  - wins: 15, losses: 5
  - Bio: If you're not using Vim, you're not living. Also, I love Rust.

- LexFridman

  - email: lex@mit.edu
  - wins: 8, losses: 8
  - Bio: Love is the answer. Also, let's talk about consciousness and AI.

- ElonMusk

  - email: elon@x.com
  - wins: 42, losses: 0
  - Bio: Let's make Pong multiplanetary! 🚀

- CheGuevara
  - email: che@revolution.cu
  - wins: 20, losses: 2
  - Bio: Hasta la victoria siempre! Even in Pong.

Each user has:

- Profile information
- Game history
- Win/loss statistics
- Avatar image in media/avatars/tests/
