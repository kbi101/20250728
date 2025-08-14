#!/bin/bash

# Navigate to the directory containing docker-compose.yml
cd "$(dirname "$0")"

# --- Configuration ---
FRONTEND_URL="http://localhost:3002"
BACKEND_URL="http://localhost:8002"
MAX_RETRIES=30
RETRY_INTERVAL=5 # seconds

# --- Functions ---
wait_for_url() {
  local url="$1"
  local service_name="$2"
  echo "Waiting for $service_name at $url to be ready..."
  for i in $(seq 1 $MAX_RETRIES); do
    if curl -s -f "$url" > /dev/null; then
      echo "$service_name is ready."
      return 0
    fi
    echo "Attempt $i/$MAX_RETRIES: $service_name not ready yet. Retrying in $RETRY_INTERVAL seconds..."
    sleep $RETRY_INTERVAL
  done
  echo "Error: $service_name did not become ready within the timeout."
  return 1
}

# --- Main Test Script ---

echo "--- Starting Deployment Test ---"

# 1. Build Docker images
echo "Building Docker images..."
./build.sh
if [ $? -ne 0 ]; then
  echo "Build failed. Exiting."
  exit 1
fi

# 2. Deploy Docker containers
echo "Deploying Docker containers..."
./deploy.sh
if [ $? -ne 0 ]; then
  echo "Deployment failed. Exiting."
  exit 1
fi

# 3. Wait for services to be ready
wait_for_url "$FRONTEND_URL" "Frontend"
if [ $? -ne 0 ]; then
  docker-compose -f docker-compose.yml down
  exit 1
fi

wait_for_url "$BACKEND_URL/nodes" "Backend API"
if [ $? -ne 0 ]; then
  docker-compose -f docker-compose.yml down
  exit 1
fi

# 4. Verify Frontend Content (basic check)
echo "Verifying Frontend content..."
FRONTEND_CONTENT=$(curl -s "$FRONTEND_URL")
if echo "$FRONTEND_CONTENT" | grep -q "Control Panel"; then
  echo "Frontend content check passed."
else
  echo "Error: Frontend content check failed. Expected 'Control Panel' not found."
  docker-compose -f docker-compose.yml down
  exit 1
fi

# 5. Verify Backend Data (basic check - expecting empty array if no data populated)
echo "Verifying Backend data..."
BACKEND_DATA=$(curl -s "$BACKEND_URL/nodes")
if echo "$BACKEND_DATA" | grep -q "^\[.*\]$"; then # Check if it's a JSON array
  echo "Backend data check passed (received JSON array)."
else
  echo "Error: Backend data check failed. Did not receive a JSON array."
  docker-compose -f docker-compose.yml down
  exit 1
fi

echo "--- Deployment Test Passed Successfully! ---"

# 6. Clean up
echo "Cleaning up Docker containers..."
docker-compose -f docker-compose.yml down

exit 0
