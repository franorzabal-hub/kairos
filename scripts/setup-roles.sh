#!/bin/bash

# Setup Roles and Permissions for Kairos
DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found."
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "Creating roles..."

# Create Org Admin role
ORG_ADMIN_ID=$(curl -s -X POST "$API/roles" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Org Admin",
    "icon": "admin_panel_settings",
    "description": "Administrator of a school organization",
    "app_access": true,
    "admin_access": false
  }' | jq -r '.data.id')
echo "Created Org Admin role: $ORG_ADMIN_ID"

# Create Teacher role
TEACHER_ID=$(curl -s -X POST "$API/roles" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teacher",
    "icon": "school",
    "description": "Teacher with content creation permissions",
    "app_access": true,
    "admin_access": false
  }' | jq -r '.data.id')
echo "Created Teacher role: $TEACHER_ID"

# Create Parent role
PARENT_ID=$(curl -s -X POST "$API/roles" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Parent",
    "icon": "family_restroom",
    "description": "Parent with read access and pickup requests",
    "app_access": true,
    "admin_access": false
  }' | jq -r '.data.id')
echo "Created Parent role: $PARENT_ID"

# Create Staff role
STAFF_ID=$(curl -s -X POST "$API/roles" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Staff",
    "icon": "badge",
    "description": "School staff with limited permissions",
    "app_access": true,
    "admin_access": false
  }' | jq -r '.data.id')
echo "Created Staff role: $STAFF_ID"

echo ""
echo "Setting up permissions..."

# Collections that all roles can read (within their org)
READABLE_COLLECTIONS="organizations grades sections locations announcements events"

# Helper to create permission
create_permission() {
  local role=$1
  local collection=$2
  local action=$3
  local fields=$4
  local permissions=$5

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

# =====================
# ORG ADMIN PERMISSIONS
# =====================
echo "Setting Org Admin permissions..."

# Full CRUD on most collections (filtered by org)
for collection in organizations app_users students student_guardians grades sections locations announcements events event_responses messages message_reads pickup_requests reports custom_field_definitions custom_tables; do
  for action in create read update delete; do
    if [ "$collection" = "organizations" ] && [ "$action" != "read" ] && [ "$action" != "update" ]; then
      continue # Org admins can only read/update their own org
    fi
    create_permission "$ORG_ADMIN_ID" "$collection" "$action" '["*"]' '{}'
  done
done

# =====================
# TEACHER PERMISSIONS
# =====================
echo "Setting Teacher permissions..."

# Read access
for collection in organizations grades sections locations students; do
  create_permission "$TEACHER_ID" "$collection" "read" '["*"]' '{}'
done

# CRUD on content they create
for collection in announcements events messages reports; do
  create_permission "$TEACHER_ID" "$collection" "create" '["*"]' '{}'
  create_permission "$TEACHER_ID" "$collection" "read" '["*"]' '{}'
  create_permission "$TEACHER_ID" "$collection" "update" '["*"]' '{"author_id": {"_eq": "$CURRENT_USER"}}'
  create_permission "$TEACHER_ID" "$collection" "delete" '["*"]' '{"author_id": {"_eq": "$CURRENT_USER"}}'
done

# Read event responses
create_permission "$TEACHER_ID" "event_responses" "read" '["*"]' '{}'

# Read/update pickup requests
create_permission "$TEACHER_ID" "pickup_requests" "read" '["*"]' '{}'
create_permission "$TEACHER_ID" "pickup_requests" "update" '["status", "reviewed_by", "reviewed_at", "notes"]' '{}'

# =====================
# PARENT PERMISSIONS
# =====================
echo "Setting Parent permissions..."

# Read access to public content
for collection in organizations grades sections locations announcements events; do
  create_permission "$PARENT_ID" "$collection" "read" '["*"]' '{}'
done

# Read own children and their data
create_permission "$PARENT_ID" "students" "read" '["*"]' '{}'
create_permission "$PARENT_ID" "student_guardians" "read" '["*"]' '{"user_id": {"_eq": "$CURRENT_USER"}}'
create_permission "$PARENT_ID" "reports" "read" '["*"]' '{"visible_to_parents": {"_eq": true}}'

# Messages - read all, create replies
create_permission "$PARENT_ID" "messages" "read" '["*"]' '{}'
create_permission "$PARENT_ID" "messages" "create" '["*"]' '{"parent_id": {"_nnull": true}}'

# Event responses - CRUD for their children
create_permission "$PARENT_ID" "event_responses" "create" '["*"]' '{}'
create_permission "$PARENT_ID" "event_responses" "read" '["*"]' '{"user_id": {"_eq": "$CURRENT_USER"}}'
create_permission "$PARENT_ID" "event_responses" "update" '["*"]' '{"user_id": {"_eq": "$CURRENT_USER"}}'

# Pickup requests - create and read own
create_permission "$PARENT_ID" "pickup_requests" "create" '["*"]' '{}'
create_permission "$PARENT_ID" "pickup_requests" "read" '["*"]' '{"requested_by": {"_eq": "$CURRENT_USER"}}'

# =====================
# STAFF PERMISSIONS
# =====================
echo "Setting Staff permissions..."

# Read access to public content
for collection in organizations grades sections locations announcements events students; do
  create_permission "$STAFF_ID" "$collection" "read" '["*"]' '{}'
done

# Pickup requests - read and update
create_permission "$STAFF_ID" "pickup_requests" "read" '["*"]' '{}'
create_permission "$STAFF_ID" "pickup_requests" "update" '["status", "reviewed_by", "reviewed_at", "notes"]' '{}'

echo ""
echo "Roles and permissions configured!"
echo ""
echo "Role IDs:"
echo "  Org Admin: $ORG_ADMIN_ID"
echo "  Teacher:   $TEACHER_ID"
echo "  Parent:    $PARENT_ID"
echo "  Staff:     $STAFF_ID"

# Save role IDs for later use
echo "{\"org_admin\": \"$ORG_ADMIN_ID\", \"teacher\": \"$TEACHER_ID\", \"parent\": \"$PARENT_ID\", \"staff\": \"$STAFF_ID\"}" > /tmp/kairos_roles.json
