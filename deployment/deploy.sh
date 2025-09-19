#!/bin/bash

# Navigate to the directory containing docker-compose.yml
cd "$(dirname "$0")"

# Ensure config.ini exists
if [ ! -f "config.ini" ]; then
  echo "Error: config.ini not found in the deployment directory."
  echo "Please create a config.ini file with your Neo4j connection details."
  echo "Example:"
  echo "[neo4j]"
  echo "uri = bolt://host.docker.internal:7687"
  echo "user = neo4j"
  echo "password = your_password"
  exit 1
fi

echo "Starting Docker containers..."
docker-compose -f docker-compose.yml up -d

if [ $? -eq 0 ]; then
  echo "Docker containers started successfully in detached mode."
  echo "Application accessible at http://localhost:3002"
else
  echo "Error: Docker containers failed to start."
  exit 1
fi
