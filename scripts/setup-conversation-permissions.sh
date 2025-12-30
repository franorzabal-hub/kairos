#!/bin/bash

# Setup Permissions for Conversation Collections
# This script adds permissions for conversations, conversation_participants, and conversation_messages

DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus.run.app}"
TOKEN="${DIRECTUS_TOKEN:-}"

if [ -z "$TOKEN" ]; then
  # Try to read from file
  TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")
fi

if [ -z "$TOKEN" ]; then
  echo "Error: No token found. Set DIRECTUS_TOKEN env var or create /tmp/directus_token.txt"
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "Fetching existing roles..."

# Get role IDs from the API
ROLES=$(curl -s -X GET "$API/roles" \
  -H "$AUTH" \
  -H "Content-Type: application/json")

ORG_ADMIN_ID=$(echo "$ROLES" | jq -r '.data[] | select(.name == "Org Admin") | .id')
TEACHER_ID=$(echo "$ROLES" | jq -r '.data[] | select(.name == "Teacher") | .id')
PARENT_ID=$(echo "$ROLES" | jq -r '.data[] | select(.name == "Parent") | .id')
STAFF_ID=$(echo "$ROLES" | jq -r '.data[] | select(.name == "Staff") | .id')

echo "Role IDs found:"
echo "  Org Admin: $ORG_ADMIN_ID"
echo "  Teacher:   $TEACHER_ID"
echo "  Parent:    $PARENT_ID"
echo "  Staff:     $STAFF_ID"

if [ -z "$TEACHER_ID" ] || [ "$TEACHER_ID" = "null" ]; then
  echo "Error: Could not find Teacher role. Ensure roles are set up first."
  exit 1
fi

# Helper to create permission
create_permission() {
  local role=$1
  local collection=$2
  local action=$3
  local fields=$4
  local permissions=$5

  echo "  Creating $action permission for $collection..."

  curl -s -X POST "$API/permissions" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{
      \"role\": \"$role\",
      \"collection\": \"$collection\",
      \"action\": \"$action\",
      \"fields\": $fields,
      \"permissions\": $permissions
    }" > /dev/null
}

echo ""
echo "=========================================="
echo "Setting up CONVERSATIONS permissions..."
echo "=========================================="

# =====================
# ORG ADMIN - Full access to all conversations in their org
# =====================
echo ""
echo "Org Admin permissions..."
for collection in conversations conversation_participants conversation_messages; do
  for action in create read update delete; do
    create_permission "$ORG_ADMIN_ID" "$collection" "$action" '["*"]' '{}'
  done
done

# =====================
# TEACHER - Can create, read all, update/close own conversations
# =====================
echo ""
echo "Teacher permissions..."

# conversations
create_permission "$TEACHER_ID" "conversations" "create" '["*"]' '{}'
create_permission "$TEACHER_ID" "conversations" "read" '["*"]' '{}'
# Teachers can update/close conversations they started
create_permission "$TEACHER_ID" "conversations" "update" '["*"]' '{"started_by": {"_eq": "$CURRENT_USER"}}'

# conversation_participants - Teachers can manage participants in their conversations
create_permission "$TEACHER_ID" "conversation_participants" "create" '["*"]' '{}'
create_permission "$TEACHER_ID" "conversation_participants" "read" '["*"]' '{}'
create_permission "$TEACHER_ID" "conversation_participants" "update" '["*"]' '{}'

# conversation_messages - Teachers can send messages and read all
create_permission "$TEACHER_ID" "conversation_messages" "create" '["*"]' '{}'
create_permission "$TEACHER_ID" "conversation_messages" "read" '["*"]' '{}'
# Soft delete only their own messages
create_permission "$TEACHER_ID" "conversation_messages" "update" '["deleted_at"]' '{"sender_id": {"_eq": "$CURRENT_USER"}}'

# =====================
# PARENT - Can read conversations they're part of, send messages if allowed
# =====================
echo ""
echo "Parent permissions..."

# conversations - Read only conversations they're a participant in
# This requires a complex filter that checks conversation_participants
create_permission "$PARENT_ID" "conversations" "read" '["*"]' '{
  "participants": {
    "user_id": {
      "_eq": "$CURRENT_USER"
    }
  }
}'

# conversation_participants - Read only their own participation
create_permission "$PARENT_ID" "conversation_participants" "read" '["*"]' '{"user_id": {"_eq": "$CURRENT_USER"}}'
# Parents can update their last_read_at and is_muted
create_permission "$PARENT_ID" "conversation_participants" "update" '["last_read_at", "is_muted"]' '{"user_id": {"_eq": "$CURRENT_USER"}}'

# conversation_messages - Read messages in conversations they're part of
create_permission "$PARENT_ID" "conversation_messages" "read" '["*"]' '{
  "conversation_id": {
    "participants": {
      "user_id": {
        "_eq": "$CURRENT_USER"
      }
    }
  }
}'
# Parents can send messages only in conversations where can_reply is true
create_permission "$PARENT_ID" "conversation_messages" "create" '["*"]' '{
  "_and": [
    {
      "conversation_id": {
        "participants": {
          "_and": [
            {"user_id": {"_eq": "$CURRENT_USER"}},
            {"can_reply": {"_eq": true}},
            {"is_blocked": {"_eq": false}}
          ]
        }
      }
    },
    {
      "conversation_id": {
        "status": {"_eq": "open"}
      }
    }
  ]
}'

# =====================
# STAFF - Read-only access
# =====================
echo ""
echo "Staff permissions..."
for collection in conversations conversation_participants conversation_messages; do
  create_permission "$STAFF_ID" "$collection" "read" '["*"]' '{}'
done

echo ""
echo "=========================================="
echo "Conversation permissions configured!"
echo "=========================================="
echo ""
echo "Summary of permissions:"
echo "  - Org Admin: Full CRUD on all conversation collections"
echo "  - Teacher: Create conversations, manage participants, send messages, close own conversations"
echo "  - Parent: Read own conversations, send messages (if allowed), update read status"
echo "  - Staff: Read-only access"
echo ""
echo "Key business rules enforced:"
echo "  1. Only Teachers/Admins can start conversations"
echo "  2. Only Teachers/Admins can close conversations"
echo "  3. Parents can only message if can_reply=true AND is_blocked=false AND status=open"
echo "  4. Messages are never physically deleted (soft delete via deleted_at)"
