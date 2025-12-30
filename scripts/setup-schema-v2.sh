#!/bin/bash

# Schema V2 - Add missing collections and fix field mismatches
# Run after setup-schema.sh

DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found. Run authentication first."
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "Adding missing collections and fields..."

# Helper function to create collection
create_collection() {
  local name=$1
  local fields=$2

  echo "Creating collection: $name"

  curl -s -X POST "$API/collections" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{
      \"collection\": \"$name\",
      \"meta\": {
        \"collection\": \"$name\",
        \"icon\": null,
        \"note\": null,
        \"hidden\": false,
        \"singleton\": false
      },
      \"schema\": {},
      \"fields\": $fields
    }" | jq -r '.data.collection // .errors[0].message // "already exists or error"'
}

# Helper function to add field to existing collection
add_field() {
  local collection=$1
  local field_json=$2

  echo "Adding field to $collection..."

  curl -s -X POST "$API/fields/$collection" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "$field_json" | jq -r '.data.field // .errors[0].message // "already exists or error"'
}

# =============================================
# 1. Add missing fields to existing collections
# =============================================

# Add image field to announcements
add_field "announcements" '{
  "field": "image",
  "type": "uuid",
  "meta": {"interface": "file-image", "special": ["file"]}
}'

# Add image field to events
add_field "events" '{
  "field": "image",
  "type": "uuid",
  "meta": {"interface": "file-image", "special": ["file"]}
}'

# Rename publish_at to published_at in announcements (via adding new field)
# Note: Directus doesn't support field rename, so we add published_at
add_field "announcements" '{
  "field": "published_at",
  "type": "timestamp",
  "meta": {"interface": "datetime"}
}'

# =============================================
# 2. Create missing collections
# =============================================

# Content Reads - unified tracking for read status
create_collection "content_reads" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "content_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Announcement", "value": "announcement"}, {"text": "Event", "value": "event"}, {"text": "Report", "value": "report"}, {"text": "Message", "value": "message"}]}, "required": true}},
  {"field": "content_id", "type": "uuid", "meta": {"interface": "input", "required": true}},
  {"field": "read_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# Push Tokens - for mobile push notifications
create_collection "push_tokens" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "token", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "platform", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "iOS", "value": "ios"}, {"text": "Android", "value": "android"}]}, "required": true}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}},
  {"field": "updated_at", "type": "timestamp", "meta": {"special": ["date-updated"], "interface": "datetime", "readonly": true}}
]'

# Message Recipients - junction table for message delivery tracking
create_collection "message_recipients" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "message_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "delivered_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "read_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "date_created", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# Conversations - WhatsApp-style messaging
create_collection "conversations" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Private", "value": "private"}, {"text": "Group", "value": "group"}]}}, "schema": {"default_value": "private"}},
  {"field": "subject", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "started_by", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "status", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Open", "value": "open"}, {"text": "Closed", "value": "closed"}, {"text": "Archived", "value": "archived"}]}}, "schema": {"default_value": "open"}},
  {"field": "closed_by", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"]}},
  {"field": "closed_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "closed_reason", "type": "string", "meta": {"interface": "input"}},
  {"field": "date_created", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}},
  {"field": "date_updated", "type": "timestamp", "meta": {"special": ["date-updated"], "interface": "datetime", "readonly": true}}
]'

# Conversation Participants
create_collection "conversation_participants" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "conversation_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "role", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Teacher", "value": "teacher"}, {"text": "Parent", "value": "parent"}, {"text": "Admin", "value": "admin"}]}}},
  {"field": "can_reply", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": true}},
  {"field": "is_blocked", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}},
  {"field": "is_muted", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}},
  {"field": "last_read_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "date_created", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# Conversation Messages
create_collection "conversation_messages" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "conversation_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "sender_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "content", "type": "text", "meta": {"interface": "input-rich-text-html", "required": true}},
  {"field": "content_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Text", "value": "text"}, {"text": "HTML", "value": "html"}]}}, "schema": {"default_value": "text"}},
  {"field": "is_urgent", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}},
  {"field": "attachments", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "deleted_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "date_created", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

echo ""
echo "Schema V2 additions completed!"
echo ""
echo "NOTE: You may need to run setup-relations.sh and configure-directus-policies.sh"
echo "      to set up relationships and permissions for the new collections."
