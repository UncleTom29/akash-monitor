#!/bin/sh

# Specify the location of the .env file
ENV_FILE=".env"

# Load environment variables from the .env file
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' $ENV_FILE | xargs)
else
  echo "$ENV_FILE file not found"
  exit 1
fi

# Wait 10 seconds before running the script for the first time
sleep 10

# Create the CouchDB databases using the HTTP API
curl -X PUT "$COUCHDB_URL/$DB_NAME" -u "$COUCHDB_USER:$COUCHDB_PASSWORD"
curl -X PUT "http://$COUCHDB_USERNAME:$COUCHDB_PASSWORD@my-couchdb:5984/_users"
curl -X PUT "http://$COUCHDB_USERNAME:$COUCHDB_PASSWORD@my-couchdb:5984/_replicator"

# Create the CouchDB _users database using the HTTP API
curl -X PUT "$COUCHDB_URL/_users" -u "$COUCHDB_USER:$COUCHDB_PASSWORD"

# Create the CouchDB index using the HTTP API
curl -X PUT "$COUCHDB_URL/$DB_NAME/_design/utilization" \
     -H "Content-Type: application/json" \
     -d "@database_index.json" \
     -u "$COUCHDB_USER:$COUCHDB_PASSWORD"

while true; do
  # The variables are defined in the environment

  # Make gRPC request to retrieve the server status
  response=$(grpcurl -insecure provider.akashprovid.com:8444 akash.provider.v1.ProviderRPC.GetStatus)

  # Save the response in a CouchDB document by using the CouchDB HTTP API.
  curl -X POST "$COUCHDB_URL/$DB_NAME" \
       -H "Content-Type: application/json" \
       -d "$response" \
       -u "$COUCHDB_USER:$COUCHDB_PASSWORD"

  # Interval between gRPC requests
  sleep "$REQUEST_INTERVAL"
done
