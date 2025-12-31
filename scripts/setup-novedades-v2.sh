#!/bin/bash

# Novedades V2 - Enhanced announcements schema
# Adds: user pinning, user archiving, attachments, acknowledgments

DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found. Run authentication first:"
  echo "curl -X POST \"\$DIRECTUS_URL/auth/login\" -H \"Content-Type: application/json\" -d '{\"email\":\"admin@kairos.app\",\"password\":\"YOUR_PASSWORD\"}' | jq -r '.data.access_token' > /tmp/directus_token.txt"
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "=========================================="
echo "Novedades V2 - Enhanced Announcements"
echo "=========================================="

# Helper function to create collection
create_collection() {
  local name=$1
  local fields=$2
  local meta=$3

  echo "Creating collection: $name"

  curl -s -X POST "$API/collections" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{
      \"collection\": \"$name\",
      \"meta\": $meta,
      \"schema\": {},
      \"fields\": $fields
    }" | jq -r '.data.collection // .errors[0].message // "already exists or error"'
}

# Helper function to add field to existing collection
add_field() {
  local collection=$1
  local field_json=$2

  echo "  Adding field to $collection..."

  curl -s -X POST "$API/fields/$collection" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "$field_json" | jq -r '.data.field // .errors[0].message // "already exists or error"'
}

# =============================================
# 1. Add new fields to announcements
# =============================================

echo ""
echo "1. Adding fields to announcements..."

# Global pinned flag (admin can pin for everyone)
add_field "announcements" '{
  "field": "is_pinned",
  "type": "boolean",
  "schema": {"default_value": false},
  "meta": {
    "interface": "boolean",
    "display": "boolean",
    "note": "Pin this announcement to the top for all users"
  }
}'

# Requires acknowledgment flag
add_field "announcements" '{
  "field": "requires_acknowledgment",
  "type": "boolean",
  "schema": {"default_value": false},
  "meta": {
    "interface": "boolean",
    "display": "boolean",
    "note": "Require users to explicitly acknowledge this announcement"
  }
}'

# Video URL field
add_field "announcements" '{
  "field": "video_url",
  "type": "string",
  "meta": {
    "interface": "input",
    "note": "YouTube or Vimeo URL for embedded video"
  }
}'

# =============================================
# 2. Create user_pinned_announcements collection
# =============================================

echo ""
echo "2. Creating user_pinned_announcements..."

create_collection "user_pinned_announcements" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "announcement_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "pinned_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]' '{
  "collection": "user_pinned_announcements",
  "icon": "push_pin",
  "note": "User-specific pinned announcements",
  "hidden": false,
  "singleton": false,
  "group": "announcements"
}'

# =============================================
# 3. Create user_archived_announcements collection
# =============================================

echo ""
echo "3. Creating user_archived_announcements..."

create_collection "user_archived_announcements" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "announcement_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "archived_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]' '{
  "collection": "user_archived_announcements",
  "icon": "archive",
  "note": "User-specific archived announcements",
  "hidden": false,
  "singleton": false,
  "group": "announcements"
}'

# =============================================
# 4. Create announcement_acknowledgments collection
# =============================================

echo ""
echo "4. Creating announcement_acknowledgments..."

create_collection "announcement_acknowledgments" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "announcement_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "acknowledged_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]' '{
  "collection": "announcement_acknowledgments",
  "icon": "fact_check",
  "note": "Explicit acknowledgments for important announcements",
  "hidden": false,
  "singleton": false,
  "group": "announcements"
}'

# =============================================
# 5. Create announcement_attachments collection
# =============================================

echo ""
echo "5. Creating announcement_attachments..."

create_collection "announcement_attachments" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "announcement_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "file", "type": "uuid", "meta": {"interface": "file", "special": ["file"], "required": true}},
  {"field": "title", "type": "string", "meta": {"interface": "input", "note": "Optional display title for the attachment"}},
  {"field": "sort", "type": "integer", "meta": {"interface": "input", "hidden": true}}
]' '{
  "collection": "announcement_attachments",
  "icon": "attach_file",
  "note": "File attachments for announcements (PDFs, documents)",
  "hidden": false,
  "singleton": false,
  "group": "announcements"
}'

# =============================================
# 6. Set up relations
# =============================================

echo ""
echo "6. Setting up relations..."

# user_pinned_announcements -> directus_users
echo "  user_pinned_announcements.user_id -> directus_users"
curl -s -X POST "$API/relations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "user_pinned_announcements",
    "field": "user_id",
    "related_collection": "directus_users"
  }' | jq -r '.data.collection // .errors[0].message // "already exists"'

# user_pinned_announcements -> announcements
echo "  user_pinned_announcements.announcement_id -> announcements"
curl -s -X POST "$API/relations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "user_pinned_announcements",
    "field": "announcement_id",
    "related_collection": "announcements"
  }' | jq -r '.data.collection // .errors[0].message // "already exists"'

# user_archived_announcements -> directus_users
echo "  user_archived_announcements.user_id -> directus_users"
curl -s -X POST "$API/relations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "user_archived_announcements",
    "field": "user_id",
    "related_collection": "directus_users"
  }' | jq -r '.data.collection // .errors[0].message // "already exists"'

# user_archived_announcements -> announcements
echo "  user_archived_announcements.announcement_id -> announcements"
curl -s -X POST "$API/relations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "user_archived_announcements",
    "field": "announcement_id",
    "related_collection": "announcements"
  }' | jq -r '.data.collection // .errors[0].message // "already exists"'

# announcement_acknowledgments -> directus_users
echo "  announcement_acknowledgments.user_id -> directus_users"
curl -s -X POST "$API/relations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "announcement_acknowledgments",
    "field": "user_id",
    "related_collection": "directus_users"
  }' | jq -r '.data.collection // .errors[0].message // "already exists"'

# announcement_acknowledgments -> announcements
echo "  announcement_acknowledgments.announcement_id -> announcements"
curl -s -X POST "$API/relations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "announcement_acknowledgments",
    "field": "announcement_id",
    "related_collection": "announcements"
  }' | jq -r '.data.collection // .errors[0].message // "already exists"'

# announcement_attachments -> announcements
echo "  announcement_attachments.announcement_id -> announcements"
curl -s -X POST "$API/relations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "announcement_attachments",
    "field": "announcement_id",
    "related_collection": "announcements"
  }' | jq -r '.data.collection // .errors[0].message // "already exists"'

# announcement_attachments -> directus_files
echo "  announcement_attachments.file -> directus_files"
curl -s -X POST "$API/relations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "announcement_attachments",
    "field": "file",
    "related_collection": "directus_files"
  }' | jq -r '.data.collection // .errors[0].message // "already exists"'

echo ""
echo "=========================================="
echo "Novedades V2 setup complete!"
echo "=========================================="
echo ""
echo "New collections:"
echo "  - user_pinned_announcements"
echo "  - user_archived_announcements"
echo "  - announcement_acknowledgments"
echo "  - announcement_attachments"
echo ""
echo "New fields on announcements:"
echo "  - is_pinned (boolean)"
echo "  - requires_acknowledgment (boolean)"
echo "  - video_url (string)"
echo ""
echo "Next: Run configure-directus-policies.sh to set up permissions"
