#!/bin/bash

# Navigate to the directory containing docker-compose.yml
cd "$(dirname "$0")"

echo "Building Docker images..."
docker-compose -f docker-compose.yml build

if [ $? -eq 0 ]; then
  echo "Docker images built successfully."
else
  echo "Error: Docker image build failed."
  exit 1
fi
