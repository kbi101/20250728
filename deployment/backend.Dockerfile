# Stage 1: Build the frontend
FROM node:20-alpine as frontend-builder
WORKDIR /app/frontend
COPY ./frontend/package.json ./frontend/package-lock.json ./
RUN npm install
COPY ./frontend/ ./
ENV REACT_APP_BACKEND_URL=
RUN npm run build

# Stage 2: Build the backend and serve frontend
FROM python:3.11-slim-buster
WORKDIR /app
ENV PYTHONPATH=./backend
COPY ./backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt
COPY ./backend/ ./backend/
COPY --from=frontend-builder /app/frontend/build ./frontend_build

EXPOSE 8000
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
