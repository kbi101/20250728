# Neo4j FastAPI Application

This is a RESTful API built with FastAPI to perform CRUD and bulk data operations on a Neo4j graph database.

## Table of Contents
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
  - [Node Endpoints](#node-endpoints)
  - [Relation Endpoints](#relation-endpoints)
  - [Utility Endpoints](#utility-endpoints)
- [Environment Variables](#environment-variables)

## Setup

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Running the Application

Before running the application, ensure you have a Neo4j instance running and the necessary environment variables set.

To start the Uvicorn server:

```bash
uvicorn app.main:app --reload
```

The API documentation will be available at `http://127.0.0.1:8000/docs` (Swagger UI) or `http://127.00.1:8000/redoc` (ReDoc).

## API Endpoints

### Node Endpoints
Base Path: `/nodes`

*   **Create a Node**
    *   `POST /nodes`
    *   **Request Body:** `{"labels": ["string"], "properties": {"key": "value"}}`
    *   **Response Body:** The created Node object.

*   **Get a Node by ID**
    *   `GET /nodes/{node_id}`
    *   **Response Body:** The requested Node object.

*   **Update a Node by ID**
    *   `PUT /nodes/{node_id}`
    *   **Request Body:** `{"labels": ["string"] (optional), "properties": {"key": "value"} (optional)}`
    *   **Response Body:** The updated Node object.

*   **Delete a Node by ID**
    *   `DELETE /nodes/{node_id}`
    *   **Response Body:** `{"message": "Node deleted"}`

*   **List All Nodes**
    *   `GET /nodes`
    *   **Query Parameters:** `skip` (int, default 0), `limit` (int, default 10)
    *   **Response Body:** A list of Node objects.

### Relation Endpoints
Base Path: `/relations`

*   **Create a Relation**
    *   `POST /relations`
    *   **Request Body:** `{"type": "string", "startNode": "string", "endNode": "string", "properties": {"key": "value"}}`
    *   **Response Body:** The created Relation object.

*   **Get a Relation by ID**
    *   `GET /relations/{relation_id}`
    *   **Response Body:** The requested Relation object.

*   **Update a Relation by ID**
    *   `PUT /relations/{relation_id}`
    *   **Request Body:** `{"properties": {"key": "value"}}`
    *   **Response Body:** The updated Relation object.

*   **Delete a Relation by ID**
    *   `DELETE /relations/{relation_id}`
    *   **Response Body:** `{"message": "Relation deleted"}`

### Utility Endpoints
Base Path: `/utils`

*   **Export Data**
    *   `GET /utils/export`
    *   **Response Body:** A JSON object with `nodes` (list of Node objects) and `relations` (list of Relation objects).

*   **Import Data**
    *   `POST /utils/import`
    *   **Request Body:** A JSON file upload (`UploadFile`) containing `nodes` and `relations` keys.
    *   **Response Body:** A summary of the import (e.g., `{"nodes_created": 50, "relations_created": 100}`).

## Environment Variables

The following environment variables are required for the application to connect to Neo4j:

*   `NEO4J_URI`: The Bolt URI of your Neo4j instance (e.g., `bolt://localhost:7687`)
*   `NEO4J_USER`: The username for your Neo4j instance (e.g., `neo4j`)
*   `NEO4J_PASSWORD`: The password for your Neo4j instance
