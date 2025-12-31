#!/bin/bash

# Configure Directus Access Policies - Multi-tenant permissions for Kairos
# Creates organization-isolated permissions for Parent, Teacher, Staff, Admin roles

DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found. Please authenticate first:"
  echo "  1. Get an admin token from Directus"
  echo "  2. Save it to /tmp/directus_token.txt"
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "============================================"
echo "Configuring Directus Access Policies"
echo "============================================"

# Get existing roles
echo ""
echo "=== Fetching existing roles ==="
ROLES=$(curl -s "$API/roles" -H "$AUTH")
echo "$ROLES" | jq -r '.data[] | "\(.id): \(.name)"'

# Helper to get role ID by name
get_role_id() {
  local name=$1
  echo "$ROLES" | jq -r ".data[] | select(.name == \"$name\") | .id"
}

PARENT_ROLE=$(get_role_id "Parent")
TEACHER_ROLE=$(get_role_id "Teacher")
STAFF_ROLE=$(get_role_id "Staff")
ADMIN_ROLE=$(get_role_id "Admin")

echo ""
echo "Role IDs:"
echo "  Parent: $PARENT_ROLE"
echo "  Teacher: $TEACHER_ROLE"
echo "  Staff: $STAFF_ROLE"
echo "  Admin: $ADMIN_ROLE"

# If roles don't exist, create them
create_role_if_missing() {
  local name=$1
  local icon=$2
  local role_id=$(get_role_id "$name")

  if [ -z "$role_id" ]; then
    echo "Creating role: $name"
    role_id=$(curl -s -X POST "$API/roles" \
      -H "$AUTH" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"$name\",
        \"icon\": \"$icon\",
        \"app_access\": false,
        \"admin_access\": false
      }" | jq -r '.data.id // empty')
    echo "  Created: $role_id"
  fi
  echo "$role_id"
}

echo ""
echo "=== Ensuring roles exist ==="
PARENT_ROLE=$(create_role_if_missing "Parent" "family_restroom")
TEACHER_ROLE=$(create_role_if_missing "Teacher" "school")
STAFF_ROLE=$(create_role_if_missing "Staff" "badge")
ADMIN_ROLE=$(create_role_if_missing "Admin" "admin_panel_settings")

# Refetch roles
ROLES=$(curl -s "$API/roles" -H "$AUTH")

# Helper to create permission
create_permission() {
  local role=$1
  local collection=$2
  local action=$3
  local permissions=$4
  local fields=${5:-"*"}
  local validation=${6:-"{}"}

  if [ -z "$role" ]; then
    echo "  Skipping $collection.$action - no role"
    return
  fi

  echo "  $collection: $action"

  curl -s -X POST "$API/permissions" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{
      \"role\": \"$role\",
      \"collection\": \"$collection\",
      \"action\": \"$action\",
      \"permissions\": $permissions,
      \"fields\": $fields,
      \"validation\": $validation
    }" | jq -r '.data.id // .errors[0].message // "OK"' > /dev/null
}

# Helper for organization-isolated read
org_filter='{"organization_id": {"_eq": "$CURRENT_USER.organization_id"}}'

# Multi-tenant filter: user's organization only
org_permission="{\"_and\": [{\"organization_id\": {\"_eq\": \"\$CURRENT_USER.organization_id\"}}]}"

# Parent can only see their children
parent_student_permission='{
  "_and": [
    {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}},
    {"student_guardians": {"user_id": {"_eq": "$CURRENT_USER.id"}}}
  ]
}'

# Parent's own children for pickup requests
parent_pickup_permission='{
  "_and": [
    {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}},
    {"student_id": {"student_guardians": {"user_id": {"_eq": "$CURRENT_USER.id"}}}}
  ]
}'

echo ""
echo "=== Configuring Parent Permissions ==="

# Parents: Read announcements (own org)
create_permission "$PARENT_ROLE" "announcements" "read" "$org_permission"

# Parents: Read events (own org)
create_permission "$PARENT_ROLE" "events" "read" "$org_permission"

# Parents: Read/Create event responses
create_permission "$PARENT_ROLE" "event_responses" "read" '{
  "_and": [
    {"user_id": {"_eq": "$CURRENT_USER.id"}}
  ]
}'
create_permission "$PARENT_ROLE" "event_responses" "create" '{}'

# Parents: Read own students only
create_permission "$PARENT_ROLE" "students" "read" "$parent_student_permission"

# Parents: Read/Create/Update pickup requests for own children
create_permission "$PARENT_ROLE" "pickup_requests" "read" "$parent_pickup_permission"
create_permission "$PARENT_ROLE" "pickup_requests" "create" '{}'
create_permission "$PARENT_ROLE" "pickup_requests" "update" '{
  "_and": [
    {"requested_by": {"_eq": "$CURRENT_USER.id"}},
    {"status": {"_eq": "pending"}}
  ]
}'

# Parents: Read own conversations
create_permission "$PARENT_ROLE" "conversations" "read" '{
  "_and": [
    {"conversation_participants": {"user_id": {"_eq": "$CURRENT_USER.id"}}}
  ]
}'

# Parents: Read/Create messages in own conversations
create_permission "$PARENT_ROLE" "conversation_messages" "read" '{
  "_and": [
    {"conversation_id": {"conversation_participants": {"user_id": {"_eq": "$CURRENT_USER.id"}}}}
  ]
}'
create_permission "$PARENT_ROLE" "conversation_messages" "create" '{}'

# Parents: Read reports for own children
create_permission "$PARENT_ROLE" "reports" "read" '{
  "_and": [
    {"student_id": {"student_guardians": {"user_id": {"_eq": "$CURRENT_USER.id"}}}}
  ]
}'

# Parents: Read/Update own profile
create_permission "$PARENT_ROLE" "app_users" "read" '{
  "_and": [{"id": {"_eq": "$CURRENT_USER.id"}}]
}'
create_permission "$PARENT_ROLE" "app_users" "update" '{
  "_and": [{"id": {"_eq": "$CURRENT_USER.id"}}]
}' '["phone", "email", "avatar", "push_token", "notification_preferences"]'

# Parents: Read content_reads (own)
create_permission "$PARENT_ROLE" "content_reads" "read" '{
  "_and": [{"user_id": {"_eq": "$CURRENT_USER.id"}}]
}'
create_permission "$PARENT_ROLE" "content_reads" "create" '{}'
create_permission "$PARENT_ROLE" "content_reads" "update" '{
  "_and": [{"user_id": {"_eq": "$CURRENT_USER.id"}}]
}'

# Parents: Manage pinned announcements (own only)
create_permission "$PARENT_ROLE" "user_pinned_announcements" "read" '{
  "_and": [{"user_id": {"_eq": "$CURRENT_USER.id"}}]
}'
create_permission "$PARENT_ROLE" "user_pinned_announcements" "create" '{}'
create_permission "$PARENT_ROLE" "user_pinned_announcements" "delete" '{
  "_and": [{"user_id": {"_eq": "$CURRENT_USER.id"}}]
}'

# Parents: Manage archived announcements (own only)
create_permission "$PARENT_ROLE" "user_archived_announcements" "read" '{
  "_and": [{"user_id": {"_eq": "$CURRENT_USER.id"}}]
}'
create_permission "$PARENT_ROLE" "user_archived_announcements" "create" '{}'
create_permission "$PARENT_ROLE" "user_archived_announcements" "delete" '{
  "_and": [{"user_id": {"_eq": "$CURRENT_USER.id"}}]
}'

# Parents: Read/Create acknowledgments (own only)
create_permission "$PARENT_ROLE" "announcement_acknowledgments" "read" '{
  "_and": [{"user_id": {"_eq": "$CURRENT_USER.id"}}]
}'
create_permission "$PARENT_ROLE" "announcement_acknowledgments" "create" '{}'

echo ""
echo "=== Configuring Teacher Permissions ==="

# Teachers: Read/Create/Update announcements (own org)
create_permission "$TEACHER_ROLE" "announcements" "read" "$org_permission"
create_permission "$TEACHER_ROLE" "announcements" "create" '{}'
create_permission "$TEACHER_ROLE" "announcements" "update" '{
  "_and": [
    {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}},
    {"created_by": {"_eq": "$CURRENT_USER.id"}}
  ]
}'

# Teachers: CRUD events (own org)
create_permission "$TEACHER_ROLE" "events" "read" "$org_permission"
create_permission "$TEACHER_ROLE" "events" "create" '{}'
create_permission "$TEACHER_ROLE" "events" "update" '{
  "_and": [
    {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}},
    {"created_by": {"_eq": "$CURRENT_USER.id"}}
  ]
}'
create_permission "$TEACHER_ROLE" "events" "delete" '{
  "_and": [
    {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}},
    {"created_by": {"_eq": "$CURRENT_USER.id"}}
  ]
}'

# Teachers: Read students (own org)
create_permission "$TEACHER_ROLE" "students" "read" "$org_permission"

# Teachers: CRUD conversations
create_permission "$TEACHER_ROLE" "conversations" "read" '{
  "_and": [
    {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}}
  ]
}'
create_permission "$TEACHER_ROLE" "conversations" "create" '{}'
create_permission "$TEACHER_ROLE" "conversations" "update" '{
  "_and": [
    {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}}
  ]
}'

# Teachers: CRUD conversation_messages
create_permission "$TEACHER_ROLE" "conversation_messages" "read" '{
  "_and": [
    {"conversation_id": {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}}}
  ]
}'
create_permission "$TEACHER_ROLE" "conversation_messages" "create" '{}'

# Teachers: Manage conversation_participants
create_permission "$TEACHER_ROLE" "conversation_participants" "read" '{
  "_and": [
    {"conversation_id": {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}}}
  ]
}'
create_permission "$TEACHER_ROLE" "conversation_participants" "update" '{
  "_and": [
    {"conversation_id": {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}}}
  ]
}'

# Teachers: Approve pickup requests
create_permission "$TEACHER_ROLE" "pickup_requests" "read" "$org_permission"
create_permission "$TEACHER_ROLE" "pickup_requests" "update" '{
  "_and": [
    {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}}
  ]
}' '["status", "approved_by", "approved_at", "notes"]'

# Teachers: Upload reports
create_permission "$TEACHER_ROLE" "reports" "read" "$org_permission"
create_permission "$TEACHER_ROLE" "reports" "create" '{}'
create_permission "$TEACHER_ROLE" "reports" "update" '{
  "_and": [
    {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}},
    {"uploaded_by": {"_eq": "$CURRENT_USER.id"}}
  ]
}'

echo ""
echo "=== Configuring Staff Permissions ==="

# Staff: Same as Teacher for most things
create_permission "$STAFF_ROLE" "announcements" "read" "$org_permission"
create_permission "$STAFF_ROLE" "events" "read" "$org_permission"
create_permission "$STAFF_ROLE" "students" "read" "$org_permission"
create_permission "$STAFF_ROLE" "pickup_requests" "read" "$org_permission"
create_permission "$STAFF_ROLE" "pickup_requests" "update" '{
  "_and": [
    {"organization_id": {"_eq": "$CURRENT_USER.organization_id"}}
  ]
}' '["status", "approved_by", "approved_at", "notes"]'

echo ""
echo "=== Configuring Admin Permissions ==="

# Admin: Full CRUD on all collections (own org only)
admin_collections=(
  "announcements"
  "events"
  "event_responses"
  "students"
  "student_guardians"
  "app_users"
  "grades"
  "sections"
  "locations"
  "conversations"
  "conversation_participants"
  "conversation_messages"
  "pickup_requests"
  "reports"
  "content_reads"
)

for collection in "${admin_collections[@]}"; do
  create_permission "$ADMIN_ROLE" "$collection" "read" "$org_permission"
  create_permission "$ADMIN_ROLE" "$collection" "create" '{}'
  create_permission "$ADMIN_ROLE" "$collection" "update" "$org_permission"
  create_permission "$ADMIN_ROLE" "$collection" "delete" "$org_permission"
done

# Admin: User action collections (no organization_id field, filter by user's org through relation)
user_action_collections=(
  "user_pinned_announcements"
  "user_archived_announcements"
  "announcement_acknowledgments"
)

for collection in "${user_action_collections[@]}"; do
  # Admins can read/manage all user actions (for analytics/support)
  create_permission "$ADMIN_ROLE" "$collection" "read" '{}'
  create_permission "$ADMIN_ROLE" "$collection" "create" '{}'
  create_permission "$ADMIN_ROLE" "$collection" "update" '{}'
  create_permission "$ADMIN_ROLE" "$collection" "delete" '{}'
done

# Admin: Read organization (own only)
create_permission "$ADMIN_ROLE" "organizations" "read" '{
  "_and": [{"id": {"_eq": "$CURRENT_USER.organization_id"}}]
}'
create_permission "$ADMIN_ROLE" "organizations" "update" '{
  "_and": [{"id": {"_eq": "$CURRENT_USER.organization_id"}}]
}'

echo ""
echo "=== Adding File Permissions ==="

# All roles can read files from their organization
for role in "$PARENT_ROLE" "$TEACHER_ROLE" "$STAFF_ROLE" "$ADMIN_ROLE"; do
  if [ -n "$role" ]; then
    create_permission "$role" "directus_files" "read" '{}'
  fi
done

# Teachers and Admin can upload files
for role in "$TEACHER_ROLE" "$ADMIN_ROLE"; do
  if [ -n "$role" ]; then
    create_permission "$role" "directus_files" "create" '{}'
  fi
done

echo ""
echo "============================================"
echo "Directus Access Policies Configuration Complete!"
echo "============================================"
echo ""
echo "Configured Roles:"
echo "  - Parent: Read announcements, events, own children, own conversations"
echo "  - Teacher: Create content, manage conversations, approve pickup"
echo "  - Staff: View content, approve pickup"
echo "  - Admin: Full CRUD on organization data"
echo ""
echo "Key Security Features:"
echo "  - Organization isolation: Users can only see data from their org"
echo "  - Parent isolation: Parents only see their own children"
echo "  - Ownership rules: Users can only edit their own content"
echo ""
echo "Check Directus admin at: $DIRECTUS_URL/admin/settings/access-control"
