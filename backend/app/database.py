
import os
import configparser
from neo4j import GraphDatabase

class Database:
    def __init__(self, uri, user, password):
        self._driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self._driver.close()

    def query(self, query, parameters=None):
        with self._driver.session() as session:
            result = session.run(query, parameters)
            return [record for record in result]

config = configparser.ConfigParser()
config.read(os.path.join(os.path.dirname(__file__), '..', 'config.ini'))

# Replace with your Neo4j connection details
NEO4J_URI = os.environ.get("NEO4J_URI", config.get('neo4j', 'uri'))
NEO4J_USER = os.environ.get("NEO4J_USER", config.get('neo4j', 'user'))
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", config.get('neo4j', 'password'))

db = Database(NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD)
