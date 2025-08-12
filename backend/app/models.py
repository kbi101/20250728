
from pydantic import BaseModel, Field
from typing import List, Dict, Any
import uuid

class Node(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    labels: List[str]
    properties: Dict[str, Any]

class Relation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    startNode: str
    endNode: str
    properties: Dict[str, Any]

class NodeUpdate(BaseModel):
    labels: List[str] | None = None
    properties: Dict[str, Any] | None = None

class RelationUpdate(BaseModel):
    properties: Dict[str, Any] | None = None
