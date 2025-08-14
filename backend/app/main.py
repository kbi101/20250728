import os
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from . import crud, models
import json

app = FastAPI()

origins = [
    os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/nodes", response_model=models.Node)
def create_node(node: models.Node):
    return crud.create_node(node)

@app.get("/nodes/{node_id}", response_model=models.Node)
def get_node(node_id: str):
    node = crud.get_node(node_id)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")
    return node

@app.put("/nodes/{node_id}", response_model=models.Node)
def update_node(node_id: str, node_update: models.NodeUpdate):
    node = crud.update_node(node_id, node_update)
    if node is None:
        raise HTTPException(status_code=404, detail="Node not found")
    return node

@app.delete("/nodes/{node_id}")
def delete_node(node_id: str):
    crud.delete_node(node_id)
    return {"message": "Node deleted"}

@app.get("/nodes", response_model=List[models.Node])
def list_nodes(skip: int = 0, limit: int = 10, name_filter: str = None, label_filter: str = None):
    return crud.list_nodes(skip, limit, name_filter, label_filter)

@app.post("/relations", response_model=models.Relation)
def create_relation(relation: models.Relation):
    return crud.create_relation(relation)

@app.get("/relations/{relation_id}", response_model=models.Relation)
def get_relation(relation_id: str):
    relation = crud.get_relation(relation_id)
    if relation is None:
        raise HTTPException(status_code=404, detail="Relation not found")
    return relation

@app.put("/relations/{relation_id}", response_model=models.Relation)
def update_relation(relation_id: str, relation_update: models.RelationUpdate):
    relation = crud.update_relation(relation_id, relation_update)
    if relation is None:
        raise HTTPException(status_code=404, detail="Relation not found")
    return relation

@app.delete("/relations/{relation_id}")
def delete_relation(relation_id: str):
    crud.delete_relation(relation_id)
    return {"message": "Relation deleted"}

@app.get("/relations_list", response_model=List[models.Relation])
def list_relations_filtered(skip: int = 0, limit: int = 10, type_filter: str = None):
    return crud.list_relations(skip, limit, type_filter)

@app.get("/utils/export")
def export_data(name_filter: str = None, label_filter: str = None, type_filter: str = None):
    print(f"Received filters: name_filter={name_filter}, label_filter={label_filter}, type_filter={type_filter}")
    filtered_nodes = crud.list_nodes(limit=1000, name_filter=name_filter, label_filter=label_filter)
    print(f"Filtered nodes count: {len(filtered_nodes)}")
    filtered_relations = crud.list_relations(limit=1000, type_filter=type_filter)
    print(f"Filtered relations count: {len(filtered_relations)}")

    print(f"filtered_nodes content before check: {filtered_nodes}")
    if not filtered_nodes:
        print("Node filter applied and no nodes found. Returning empty graph.")
        return {"nodes": [], "relations": []}

    # If node filters are applied, relations should only be between filtered nodes
    if (name_filter and name_filter.strip()) or (label_filter and label_filter.strip()):
        nodes_in_filter_set = {node['id'] for node in filtered_nodes}
        filtered_relations_by_nodes = []
        for rel in filtered_relations:
            if rel['startNode'] in nodes_in_filter_set or rel['endNode'] in nodes_in_filter_set:
                filtered_relations_by_nodes.append(rel)
        filtered_relations = filtered_relations_by_nodes
        print(f"Filtered relations (after node-based filtering): {len(filtered_relations)}")

    # Collect all node IDs from filtered relations
    related_node_ids = set()
    for rel in filtered_relations:
        related_node_ids.add(rel['startNode'])
        related_node_ids.add(rel['endNode'])

    # Get nodes that were filtered out but are part of a filtered relation
    additional_nodes = []
    existing_node_ids = {node['id'] for node in filtered_nodes}
    for node_id in related_node_ids:
        if node_id not in existing_node_ids:
            node = crud.get_node(node_id)
            if node:
                additional_nodes.append(node)

    all_nodes = filtered_nodes + additional_nodes
    unique_nodes_dict = {node['id']: node for node in all_nodes}
    unique_nodes = unique_nodes_dict.values()
    print(f"Unique nodes count (after adding related): {len(unique_nodes)}")
    print(f"Unique node IDs (keys of unique_nodes_dict): {list(unique_nodes_dict.keys())}")

    # Filter relations to only include those whose start and end nodes are in unique_nodes
    final_relations = []
    print(f"Filtered relations (before final filter): {len(filtered_relations)}")
    for rel in filtered_relations:
        if rel['startNode'] in unique_nodes_dict and rel['endNode'] in unique_nodes_dict:
            final_relations.append(rel)
    print(f"Final relations count: {len(final_relations)}")
    print(f"Nodes returned to frontend: {list(unique_nodes)}")

    return {"nodes": list(unique_nodes), "relations": final_relations}

@app.get("/labels", response_model=List[str])
def get_labels():
    return crud.get_all_labels()

@app.get("/relationship_types", response_model=List[str])
def get_relationship_types():
    return crud.get_all_relationship_types()

@app.post("/utils/import")
async def import_data(file: UploadFile = File(...)):
    # Clear database
    db.query("MATCH (n) DETACH DELETE n")

    # Import from file
    content = await file.read()
    data = json.loads(content)

    nodes_created = 0
    for node_data in data.get("nodes", []):
        node = models.Node(**node_data)
        crud.create_node(node)
        nodes_created += 1

    relations_created = 0
    for relation_data in data.get("relations", []):
        relation = models.Relation(**relation_data)
        crud.create_relation(relation)
        relations_created += 1

    return {"nodes_created": nodes_created, "relations_created": relations_created}