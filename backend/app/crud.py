from .database import db
from .models import Node, Relation, NodeUpdate, RelationUpdate
from neo4j.graph import Node as Neo4jNode, Relationship as Neo4jRelationship

def _node_to_dict(node: Neo4jNode) -> dict:
    """Converts a neo4j Node to a dictionary."""
    properties = dict(node)
    return {
        "id": node.get("id"),
        "labels": list(node.labels),
        "properties": properties,
    }

def _relation_to_dict(record) -> dict:
    """Converts a neo4j Record from a relationship query to a dictionary."""
    properties = record.get('properties', {})
    if isinstance(properties, Neo4jRelationship):
        properties = dict(properties)

    return {
        "id": record.get("id"),
        "type": record.get("type"),
        "startNode": record.get("startNode"),
        "endNode": record.get("endNode"),
        "properties": properties,
    }

def create_node(node: Node) -> dict | None:
    labels = ":".join(node.labels)
    properties = node.properties
    properties["id"] = node.id
    query = f"CREATE (n:{labels} $properties) RETURN n"
    result = db.query(query, parameters={"properties": properties})
    if not result:
        return None
    return _node_to_dict(result[0]["n"])

def get_node(node_id: str) -> dict | None:
    query = "MATCH (n {id: $node_id}) RETURN n"
    result = db.query(query, parameters={"node_id": node_id})
    if not result:
        return None
    return _node_to_dict(result[0]["n"])

def update_node(node_id: str, node_update: NodeUpdate) -> dict | None:
    query = "MATCH (n {id: $node_id}) SET n += $properties RETURN n"
    result = db.query(query, parameters={"node_id": node_id, "properties": node_update.properties})
    if not result:
        return None
    return _node_to_dict(result[0]["n"])

def delete_node(node_id: str):
    query = "MATCH (n {id: $node_id}) DETACH DELETE n"
    db.query(query, parameters={"node_id": node_id})

def list_nodes(skip: int = 0, limit: int = 10) -> list[dict]:
    query = "MATCH (n) RETURN n SKIP $skip LIMIT $limit"
    result = db.query(query, parameters={"skip": skip, "limit": limit})
    return [_node_to_dict(record["n"]) for record in result]

def create_relation(relation: Relation) -> dict | None:
    properties = relation.properties
    properties["id"] = relation.id
    query = (
        "MATCH (a {id: $startNode}), (b {id: $endNode}) "
        f"CREATE (a)-[r:{relation.type} $properties]->(b) "
        "RETURN type(r) as type, r.id as id, r as properties, a.id as startNode, b.id as endNode"
    )
    result = db.query(query, parameters={
        "startNode": relation.startNode,
        "endNode": relation.endNode,
        "properties": properties
    })
    if not result:
        return None
    return _relation_to_dict(result[0])

def get_relation(relation_id: str) -> dict | None:
    query = "MATCH (a)-[r {id: $relation_id}]->(b) RETURN type(r) as type, r.id as id, r as properties, a.id as startNode, b.id as endNode"
    result = db.query(query, parameters={"relation_id": relation_id})
    if not result:
        return None
    return _relation_to_dict(result[0])

def update_relation(relation_id: str, relation_update: RelationUpdate) -> dict | None:
    query = """
    MATCH (a)-[r {id: $relation_id}]->(b)
    SET r += $properties
    RETURN type(r) as type, r.id as id, r as properties, a.id as startNode, b.id as endNode
    """
    result = db.query(query, parameters={"relation_id": relation_id, "properties": relation_update.properties})
    if not result:
        return None
    return _relation_to_dict(result[0])

def delete_relation(relation_id: str):
    query = "MATCH ()-[r {id: $relation_id}]-() DELETE r"
    db.query(query, parameters={"relation_id": relation_id})

def list_relations(skip: int = 0, limit: int = 10) -> list[dict]:
    query = "MATCH (a)-[r]->(b) RETURN type(r) as type, r.id as id, r as properties, a.id as startNode, b.id as endNode SKIP $skip LIMIT $limit"
    result = db.query(query, parameters={"skip": skip, "limit": limit})
    return [_relation_to_dict(record) for record in result]

def get_all_labels() -> list[str]:
    query = "CALL db.labels()"
    result = db.query(query)
    return [record["label"] for record in result]

def get_all_relationship_types() -> list[str]:
    query = "CALL db.relationshipTypes()"
    result = db.query(query)
    return [record["relationshipType"] for record in result]