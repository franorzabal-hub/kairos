#!/bin/bash

# Migration: Add cross-functional tables for Novedades feature
# This adds: content_targets, attachments, content_reads, content_user_status
# And updates announcements with new fields

DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found. Run authentication first."
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "=== Cross-Functional Tables Migration ==="
echo ""

# Helper function to add field to existing collection
add_field() {
  local collection=$1
  local field_json=$2

  echo "Adding field to $collection..."

  curl -s -X POST "$API/fields/$collection" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "$field_json" | jq -r '.data.field // .errors[0].message // "OK"'
}

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
    }" | jq -r '.data.collection // .errors[0].message'
}

echo "=== Step 1: Add new fields to announcements ==="

# Add pinned field
add_field "announcements" '{
  "field": "pinned",
  "type": "boolean",
  "meta": {"interface": "boolean", "note": "Pin this announcement to the top"},
  "schema": {"default_value": false}
}'

# Add pinned_at field
add_field "announcements" '{
  "field": "pinned_at",
  "type": "timestamp",
  "meta": {"interface": "datetime", "note": "When was it pinned"}
}'

# Add pinned_until field
add_field "announcements" '{
  "field": "pinned_until",
  "type": "timestamp",
  "meta": {"interface": "datetime", "note": "Auto-unpin after this date"}
}'

# Add requires_acknowledgment field
add_field "announcements" '{
  "field": "requires_acknowledgment",
  "type": "boolean",
  "meta": {"interface": "boolean", "note": "Requires explicit confirmation from parents"},
  "schema": {"default_value": false}
}'

# Add acknowledgment_text field
add_field "announcements" '{
  "field": "acknowledgment_text",
  "type": "string",
  "meta": {"interface": "input", "note": "Custom text for acknowledgment button (default: He leído y acepto)"}
}'

# Add image field if not exists
add_field "announcements" '{
  "field": "image",
  "type": "uuid",
  "meta": {"interface": "file-image", "special": ["file"], "note": "Main image/banner"}
}'

# Add published_at field
add_field "announcements" '{
  "field": "published_at",
  "type": "timestamp",
  "meta": {"interface": "datetime", "note": "When was it published"}
}'

echo ""
echo "=== Step 2: Create content_targets table (Cross-functional Targeting) ==="

create_collection "content_targets" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "content_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Announcement", "value": "announcement"}, {"text": "Event", "value": "event"}, {"text": "Message", "value": "message"}, {"text": "Report", "value": "report"}]}, "required": true, "note": "Type of content being targeted"}},
  {"field": "content_id", "type": "uuid", "meta": {"interface": "input", "required": true, "note": "ID of the content item"}},
  {"field": "target_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "All", "value": "all"}, {"text": "Level", "value": "level"}, {"text": "Grade", "value": "grade"}, {"text": "Section", "value": "section"}, {"text": "User", "value": "user"}]}, "required": true, "note": "Target audience type"}},
  {"field": "target_id", "type": "uuid", "meta": {"interface": "input", "note": "ID of the target (level/grade/section/user). NULL for all"}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

echo ""
echo "=== Step 3: Create attachments table (Cross-functional Attachments) ==="

create_collection "attachments" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "content_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Announcement", "value": "announcement"}, {"text": "Event", "value": "event"}, {"text": "Message", "value": "message"}]}, "required": true, "note": "Type of content"}},
  {"field": "content_id", "type": "uuid", "meta": {"interface": "input", "required": true, "note": "ID of the content item"}},
  {"field": "file_id", "type": "uuid", "meta": {"interface": "file", "special": ["file"], "required": true, "note": "The attached file"}},
  {"field": "file_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Image", "value": "image"}, {"text": "Video", "value": "video"}, {"text": "PDF", "value": "pdf"}, {"text": "Document", "value": "document"}, {"text": "Audio", "value": "audio"}]}, "required": true, "note": "Type of file"}},
  {"field": "title", "type": "string", "meta": {"interface": "input", "note": "Display title (optional)"}},
  {"field": "description", "type": "text", "meta": {"interface": "input-multiline", "note": "Description (optional)"}},
  {"field": "sort_order", "type": "integer", "meta": {"interface": "input"}, "schema": {"default_value": 0}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

echo ""
echo "=== Step 4: Create content_reads table (Cross-functional Read Tracking) ==="

create_collection "content_reads" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "content_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Announcement", "value": "announcement"}, {"text": "Event", "value": "event"}, {"text": "Message", "value": "message"}]}, "required": true}},
  {"field": "content_id", "type": "uuid", "meta": {"interface": "input", "required": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "read_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}},
  {"field": "acknowledged", "type": "boolean", "meta": {"interface": "boolean", "note": "User explicitly acknowledged"}, "schema": {"default_value": false}},
  {"field": "acknowledged_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}}
]'

echo ""
echo "=== Step 5: Create content_user_status table (User-specific status: archived, pinned) ==="

create_collection "content_user_status" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "content_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Announcement", "value": "announcement"}, {"text": "Event", "value": "event"}, {"text": "Message", "value": "message"}]}, "required": true}},
  {"field": "content_id", "type": "uuid", "meta": {"interface": "input", "required": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "is_archived", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}},
  {"field": "archived_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "is_pinned", "type": "boolean", "meta": {"interface": "boolean", "note": "User personal pin"}, "schema": {"default_value": false}},
  {"field": "pinned_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}},
  {"field": "updated_at", "type": "timestamp", "meta": {"special": ["date-updated"], "interface": "datetime", "readonly": true}}
]'

echo ""
echo "=== Step 6: Create levels table (for targeting hierarchy) ==="

create_collection "levels" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "name", "type": "string", "meta": {"interface": "input", "required": true}, "schema": {"is_nullable": false}},
  {"field": "slug", "type": "string", "meta": {"interface": "input"}, "schema": {"is_nullable": false}},
  {"field": "order", "type": "integer", "meta": {"interface": "input"}, "schema": {"default_value": 0}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

echo ""
echo "=== Migration completed! ==="
echo ""
echo "New tables created:"
echo "  - content_targets (cross-functional targeting)"
echo "  - attachments (cross-functional file attachments)"
echo "  - content_reads (cross-functional read/acknowledge tracking)"
echo "  - content_user_status (user-specific archived/pinned status)"
echo "  - levels (for targeting hierarchy)"
echo ""
echo "New fields added to announcements:"
echo "  - pinned, pinned_at, pinned_until"
echo "  - requires_acknowledgment, acknowledgment_text"
echo "  - image, published_at"
echo ""
echo "Next steps:"
echo "  1. Run ./scripts/setup-relations-cross-functional.sh to create relations"
echo "  2. Run ./scripts/setup-roles-cross-functional.sh to configure permissions"
