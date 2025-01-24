#!/bin/bash

# Get all running container names
all_containers=$(docker ps --format "{{.Names}}")

# Filter out unwanted containers
filtered_containers=$(echo "$all_containers" | grep -vE '(panel-panel|redis|nginx)')

# Loop through filtered containers and execute the command
while IFS= read -r container_name; do
    echo "Processing container: $container_name"
    
    # Execute the command inside the container using multiline syntax
    docker exec $container_name ve/bin/python <<EOF
from django.conf import settings
import os
if os.path.exists('/opt/specify7/config'):
    settings.SPECIFY_THICK_CLIENT = '/opt/specify7'
EOF
    
    echo "Finished processing $container_name"
done <<< "$filtered_containers"

echo "All containers processed."