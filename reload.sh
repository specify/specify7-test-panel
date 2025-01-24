#!/bin/bash

echo "Stopping and removing containers and volumes..."
docker compose down --volumes --remove-orphans
sleep 3

echo "Building and creating containers..."
docker compose \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  up --no-start --build
sleep 3

echo "Starting containers in detached mode..."
docker compose \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  -f /var/lib/docker/volumes/specify7-test-panel_state/_data/docker-compose.yml \
  up --remove-orphans -d