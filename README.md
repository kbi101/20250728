# Graph Visualization Application

This project provides a full-stack application for visualizing and managing graph data stored in a Neo4j database. It consists of a React frontend and a FastAPI Python backend.

## Features

*   **Frontend:** Interactive graph visualization, node/edge creation, filtering, and drag-and-drop functionality.
*   **Backend:** RESTful API for CRUD operations on Neo4j nodes and relationships.
*   **Deployment:** Dockerized setup for easy deployment and environment consistency.
*   **Externalized Configuration:** Neo4j connection details and CORS settings are configurable.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

*   **Node.js and npm:** Required for the React frontend.
    *   [Download Node.js](https://nodejs.org/)
*   **Python 3.11+ and pip:** Required for the FastAPI backend.
    *   [Download Python](https://www.python.org/downloads/)
*   **Docker and Docker Compose:** Required for running the application in containers.
    *   [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
*   **Neo4j Database:** For local development, you'll need a running Neo4j instance. You can download it or run it via Docker.
    *   [Download Neo4j Desktop](https://neo4j.com/download/)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/kbi101/20250728.git
    cd 20250728
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    cd frontend
    npm install
    cd ..
    ```

3.  **Install Backend Dependencies:**
    ```bash
    cd backend
    pip install -r requirements.txt
    cd ..
    ```

## Running Locally (Non-Docker)

To run the application locally, you need a running Neo4j instance on your host machine.

1.  **Start Neo4j:**
    Ensure your Neo4j database is running and accessible on `bolt://localhost:7687` with username `neo4j` and your configured password (e.g., `password`).

2.  **Start the Backend:**
    Navigate to the `backend` directory and start the FastAPI application. The backend will listen on port `8002`.
    ```bash
    cd backend
    uvicorn app.main:app --host 0.0.0.0 --port 8002
    ```
    *Note: The backend will read Neo4j connection details from `backend/config.ini` or environment variables. Ensure `backend/config.ini` has the correct Neo4j URI, username, and password for your local Neo4j instance.* For example:
    ```ini
    # backend/config.ini
    [neo4j]
    uri = bolt://localhost:7687
    user = neo4j
    password = your_neo4j_password
    ```

3.  **Start the Frontend:**
    Navigate to the `frontend` directory. You need to set an environment variable `REACT_APP_BACKEND_URL` to point to your local backend.
    ```bash
    cd frontend
    export REACT_APP_BACKEND_URL=http://localhost:8002 # For macOS/Linux
    # set REACT_APP_BACKEND_URL=http://localhost:8002   # For Windows Command Prompt
    # $env:REACT_APP_BACKEND_URL="http://localhost:8002" # For Windows PowerShell
    npm start
    ```
    The frontend will typically open in your browser at `http://localhost:3000`.

## Running with Docker

This project includes Dockerfiles and a `docker-compose.yml` for easy containerized deployment.

1.  **Create `config.ini` for Docker:**
    Create a `config.ini` file inside the `deployment` directory. This file will be mounted into the backend container to provide Neo4j connection details.
    ```ini
    # deployment/config.ini
    [neo4j]
    uri = bolt://host.docker.internal:7687
    user = neo4j
    password = your_neo4j_password
    ```
    *Note: `host.docker.internal` is a special DNS name that resolves to the internal IP address of the host from within a Docker container. This allows the backend container to connect to a Neo4j instance running directly on your host machine.* If your Neo4j is running in another Docker container, you would use the service name (e.g., `bolt://neo4j:7687`).

2.  **Build Docker Images:**
    Navigate to the project root directory and use the provided build script.
    ```bash
    ./deployment/build.sh
    ```
    This will build both the `deployment-frontend` and `deployment-backend` Docker images.

3.  **Deploy Docker Containers:**
    Use the provided deploy script to start the containers.
    ```bash
    ./deployment/deploy.sh
    ```
    This will start the frontend (Nginx) and backend (FastAPI) containers in detached mode.

4.  **Access the Applications:**
    *   **Frontend:** `http://localhost:3002`
    *   **Backend API:** `http://localhost:8002` (e.g., `http://localhost:8002/nodes`)

5.  **Stop Docker Containers:**
    To stop and remove the running containers:
    ```bash
    docker-compose -f deployment/docker-compose.yml down
    ```

## Populating Neo4j (Optional)

If you are running Neo4j in Docker, you can populate it with sample data using `cypher-shell` from your host machine. First, ensure your Neo4j container is running.

*   **Example Data Population (Alice and Bob nodes, KNOWS relationship):**
    ```bash
    # Replace with actual UUIDs generated by a tool or script
    NODE_ID_ALICE="<UUID_FOR_ALICE>"
    NODE_ID_BOB="<UUID_FOR_BOB>"
    RELATION_ID_KNOWS="<UUID_FOR_KNOWS_RELATION>"

    docker exec -it deployment-neo4j-1 cypher-shell -u neo4j -p password "CREATE (a:Person {id: '$NODE_ID_ALICE', name: 'Alice', age: 30}), (b:Person {id: '$NODE_ID_BOB', name: 'Bob', age: 25}), (a)-[r:KNOWS {id: '$RELATION_ID_KNOWS', since: '2023-01-01'}]->(b)"
    ```
    *Note: You will need to replace `<UUID_FOR_ALICE>`, `<UUID_FOR_BOB>`, and `<UUID_FOR_KNOWS_RELATION>` with actual UUIDs. You can generate UUIDs using `python3 -c 'import uuid; print(uuid.uuid4())'`.*

## Troubleshooting

*   **`net::ERR_CONNECTION_REFUSED` or `Connection refused`:**
    *   Ensure the backend application is running and accessible on the expected port (`8002` for local, `8000` inside Docker).
    *   Check for port conflicts on your host machine. Use `lsof -i :<port>` (macOS/Linux) or `netstat -ano | findstr :<port>` (Windows) to identify processes using the port.
    *   Verify your Neo4j instance is running and accessible.

*   **CORS Errors (`Access-Control-Allow-Origin` header missing):**
    *   Ensure the `FRONTEND_ORIGIN` environment variable is correctly set for the backend service in `docker-compose.yml` (for Docker) or in your local environment (for local backend).
    *   Verify the backend Docker image has been rebuilt after any changes to `backend/app/main.py`.

*   **`ModuleNotFoundError: No module named 'app'` (Backend Docker):**
    *   Ensure `backend.Dockerfile` has `WORKDIR /app/backend` and `COPY ./backend/ ./` to correctly place the `app` module.
    *   Verify the backend Docker image has been rebuilt.

*   **`Unrecognized setting: db.name` (Neo4j Docker):**
    *   This error indicates an outdated Neo4j environment variable. Remove `NEO4J_db_name` from your `docker-compose.yml` if you are using Neo4j 5.x or newer.

## Project Structure (Brief)

*   `frontend/`: React application source code.
*   `backend/`: FastAPI Python application source code.
*   `deployment/`: Dockerfiles, `docker-compose.yml`, and deployment scripts.
*   `README.md`: This file.
