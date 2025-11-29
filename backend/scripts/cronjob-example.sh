#!/bin/bash

# Example cronjob script for fetching and storing articles
# Add to crontab: 0 * * * * /path/to/scripts/cronjob-example.sh

API_URL="http://localhost:3000/api/articles/fetch-and-store"
LIMIT=30

echo "$(date): Fetching and storing articles from Hacker News..."

curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"limit\": $LIMIT}" \
  -s \
  | jq '.'

echo "$(date): Done"

