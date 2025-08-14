
# Stage 1: Build the React frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app/frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install
COPY ./frontend/ . .
RUN npm run build

# Stage 2: Build the Python backend
FROM python:3.11-slim-buster as backend-builder
WORKDIR /app/backend
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Final image
FROM python:3.11-slim-buster
WORKDIR /app

# Copy frontend build artifacts
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Copy backend dependencies and code
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY ./backend/ ./backend/

# Copy config.ini (will be replaced by volume mount in production)
COPY ./backend/config.ini ./backend/config.ini

WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
