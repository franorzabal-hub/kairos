#!/bin/bash

# Setup relations for cross-functional tables
# Run after migrate-cross-functional.sh

DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found. Run authentication first."
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "=== Setting up relations for cross-functional tables ==="
echo ""

# Helper function to create relation
create_relation() {
  local json=$1
  echo "Creating relation..."
  curl -s -X POST "$API/relations" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "$json" | jq -r '.data.collection // .errors[0].message // "OK"'
}

echo "=== content_targets relations ==="

# content_targets -> organizations
create_relation '{
  "collection": "content_targets",
  "field": "organization_id",
  "related_collection": "organizations",
  "meta": {
    "many_collection": "content_targets",
    "many_field": "organization_id",
    "one_collection": "organizations",
    "one_field": null,
    "one_deselect_action": "nullify"
  },
  "schema": {
    "on_delete": "CASCADE"
  }
}'

echo ""
echo "=== attachments relations ==="

# attachments -> organizations
create_relation '{
  "collection": "attachments",
  "field": "organization_id",
  "related_collection": "organizations",
  "meta": {
    "many_collection": "attachments",
    "many_field": "organization_id",
    "one_collection": "organizations",
    "one_field": null,
    "one_deselect_action": "nullify"
  },
  "schema": {
    "on_delete": "CASCADE"
  }
}'

# attachments -> directus_files
create_relation '{
  "collection": "attachments",
  "field": "file_id",
  "related_collection": "directus_files",
  "meta": {
    "many_collection": "attachments",
    "many_field": "file_id",
    "one_collection": "directus_files",
    "one_field": null,
    "one_deselect_action": "nullify"
  },
  "schema": {
    "on_delete": "CASCADE"
  }
}'

echo ""
echo "=== content_reads relations ==="

# content_reads -> organizations
create_relation '{
  "collection": "content_reads",
  "field": "organization_id",
  "related_collection": "organizations",
  "meta": {
    "many_collection": "content_reads",
    "many_field": "organization_id",
    "one_collection": "organizations",
    "one_field": null,
    "one_deselect_action": "nullify"
  },
  "schema": {
    "on_delete": "CASCADE"
  }
}'

# content_reads -> app_users
create_relation '{
  "collection": "content_reads",
  "field": "user_id",
  "related_collection": "app_users",
  "meta": {
    "many_collection": "content_reads",
    "many_field": "user_id",
    "one_collection": "app_users",
    "one_field": null,
    "one_deselect_action": "nullify"
  },
  "schema": {
    "on_delete": "CASCADE"
  }
}'

echo ""
echo "=== content_user_status relations ==="

# content_user_status -> organizations
create_relation '{
  "collection": "content_user_status",
  "field": "organization_id",
  "related_collection": "organizations",
  "meta": {
    "many_collection": "content_user_status",
    "many_field": "organization_id",
    "one_collection": "organizations",
    "one_field": null,
    "one_deselect_action": "nullify"
  },
  "schema": {
    "on_delete": "CASCADE"
  }
}'

# content_user_status -> app_users
create_relation '{
  "collection": "content_user_status",
  "field": "user_id",
  "related_collection": "app_users",
  "meta": {
    "many_collection": "content_user_status",
    "many_field": "user_id",
    "one_collection": "app_users",
    "one_field": null,
    "one_deselect_action": "nullify"
  },
  "schema": {
    "on_delete": "CASCADE"
  }
}'

echo ""
echo "=== levels relations ==="

# levels -> organizations
create_relation '{
  "collection": "levels",
  "field": "organization_id",
  "related_collection": "organizations",
  "meta": {
    "many_collection": "levels",
    "many_field": "organization_id",
    "one_collection": "organizations",
    "one_field": null,
    "one_deselect_action": "nullify"
  },
  "schema": {
    "on_delete": "CASCADE"
  }
}'

echo ""
echo "=== announcements new relations ==="

# announcements -> directus_files (image)
create_relation '{
  "collection": "announcements",
  "field": "image",
  "related_collection": "directus_files",
  "meta": {
    "many_collection": "announcements",
    "many_field": "image",
    "one_collection": "directus_files",
    "one_field": null,
    "one_deselect_action": "nullify"
  }
}'

echo ""
echo "=== Adding level_id to grades ==="

# Add level_id field to grades if not exists
echo "Adding level_id field to grades..."
curl -s -X POST "$API/fields/grades" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "field": "level_id",
    "type": "uuid",
    "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"]}
  }' | jq -r '.data.field // .errors[0].message // "OK"'

# grades -> levels
create_relation '{
  "collection": "grades",
  "field": "level_id",
  "related_collection": "levels",
  "meta": {
    "many_collection": "grades",
    "many_field": "level_id",
    "one_collection": "levels",
    "one_field": "grades",
    "one_deselect_action": "nullify"
  },
  "schema": {
    "on_delete": "SET NULL"
  }
}'

echo ""
echo "=== Relations setup completed! ==="
