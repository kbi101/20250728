# Frontend Application: Neo4j Graph Visualizer

## Goal

Create a front-end application using React to visualize and interact with a Neo4j graph database.

## Data Interaction

The application will communicate with the existing backend service located in the `../backend` directory. It will make API calls to this service to perform the following operations on the Neo4j database:

*   **Load:** Fetch and display the current graph data (nodes and edges).
*   **Add:** Create new nodes and edges.
*   **Modify:** Update existing nodes and edges.
*   **Delete:** Remove nodes and edges.

## Frontend Design

### Scaffolding

The front-end application will be built within this `frontend` folder.

### User Interface

The main interface will consist of two primary sections:

1.  **Graph Display:** A central area dedicated to visualizing the Neo4j graph. This will render the nodes and their relationships (edges).

2.  **Control Panel:** A panel positioned on the right side of the screen. This panel will contain the primary controls for manipulating the graph, including:
    *   **Add Node:** A form or set of inputs to create a new node.
    *   **Add Edge:** A form or mechanism to create a new edge between two existing nodes.