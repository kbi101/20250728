from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from . import crud, models
import json

app = FastAPI()

origins = [
    "http://localhost:3000",
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
def list_nodes(skip: int = 0, limit: int = 10):
    return crud.list_nodes(skip, limit)

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

@app.get("/utils/export")
def export_data():
    nodes = crud.list_nodes(limit=1000)
    relations = crud.list_relations(limit=1000)

    unique_nodes = {node['id']: node for node in nodes}.values()

    return {"nodes": list(unique_nodes), "relations": relations}

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