#!/bin/bash

# Setup permissions for cross-functional tables
# Run after setup-relations-cross-functional.sh

DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found. Run authentication first."
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "=== Setting up permissions for cross-functional tables ==="
echo ""

# Get role IDs
echo "Getting role IDs..."
PARENT_ROLE=$(curl -s "$API/roles?filter[name][_eq]=Parent" -H "$AUTH" | jq -r '.data[0].id')
TEACHER_ROLE=$(curl -s "$API/roles?filter[name][_eq]=Teacher" -H "$AUTH" | jq -r '.data[0].id')
ADMIN_ROLE=$(curl -s "$API/roles?filter[name][_eq]=Admin" -H "$AUTH" | jq -r '.data[0].id')

echo "Parent Role: $PARENT_ROLE"
echo "Teacher Role: $TEACHER_ROLE"
echo "Admin Role: $ADMIN_ROLE"

# Helper function to create permission
create_permission() {
  local json=$1
  curl -s -X POST "$API/permissions" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "$json" | jq -r '.data.id // .errors[0].message // "OK"'
}

echo ""
echo "=== content_targets permissions ==="

# Parents: Read only (their own content)
if [ "$PARENT_ROLE" != "null" ]; then
  echo "Creating content_targets permissions for Parents..."
  create_permission "{
    \"role\": \"$PARENT_ROLE\",
    \"collection\": \"content_targets\",
    \"action\": \"read\",
    \"permissions\": {},
    \"fields\": [\"*\"]
  }"
fi

# Teachers: Full CRUD
if [ "$TEACHER_ROLE" != "null" ]; then
  echo "Creating content_targets permissions for Teachers..."
  for action in create read update delete; do
    create_permission "{
      \"role\": \"$TEACHER_ROLE\",
      \"collection\": \"content_targets\",
      \"action\": \"$action\",
      \"permissions\": {},
      \"fields\": [\"*\"]
    }"
  done
fi

# Admins: Full CRUD
if [ "$ADMIN_ROLE" != "null" ]; then
  echo "Creating content_targets permissions for Admins..."
  for action in create read update delete; do
    create_permission "{
      \"role\": \"$ADMIN_ROLE\",
      \"collection\": \"content_targets\",
      \"action\": \"$action\",
      \"permissions\": {},
      \"fields\": [\"*\"]
    }"
  done
fi

echo ""
echo "=== attachments permissions ==="

# Parents: Read only
if [ "$PARENT_ROLE" != "null" ]; then
  echo "Creating attachments permissions for Parents..."
  create_permission "{
    \"role\": \"$PARENT_ROLE\",
    \"collection\": \"attachments\",
    \"action\": \"read\",
    \"permissions\": {},
    \"fields\": [\"*\"]
  }"
fi

# Teachers: Full CRUD
if [ "$TEACHER_ROLE" != "null" ]; then
  echo "Creating attachments permissions for Teachers..."
  for action in create read update delete; do
    create_permission "{
      \"role\": \"$TEACHER_ROLE\",
      \"collection\": \"attachments\",
      \"action\": \"$action\",
      \"permissions\": {},
      \"fields\": [\"*\"]
    }"
  done
fi

# Admins: Full CRUD
if [ "$ADMIN_ROLE" != "null" ]; then
  echo "Creating attachments permissions for Admins..."
  for action in create read update delete; do
    create_permission "{
      \"role\": \"$ADMIN_ROLE\",
      \"collection\": \"attachments\",
      \"action\": \"$action\",
      \"permissions\": {},
      \"fields\": [\"*\"]
    }"
  done
fi

echo ""
echo "=== content_reads permissions ==="

# Parents: Create and Read own
if [ "$PARENT_ROLE" != "null" ]; then
  echo "Creating content_reads permissions for Parents..."
  create_permission "{
    \"role\": \"$PARENT_ROLE\",
    \"collection\": \"content_reads\",
    \"action\": \"create\",
    \"permissions\": {},
    \"fields\": [\"*\"]
  }"
  create_permission "{
    \"role\": \"$PARENT_ROLE\",
    \"collection\": \"content_reads\",
    \"action\": \"read\",
    \"permissions\": {\"_and\": [{\"user_id\": {\"_eq\": \"\$CURRENT_USER\"}}]},
    \"fields\": [\"*\"]
  }"
  create_permission "{
    \"role\": \"$PARENT_ROLE\",
    \"collection\": \"content_reads\",
    \"action\": \"update\",
    \"permissions\": {\"_and\": [{\"user_id\": {\"_eq\": \"\$CURRENT_USER\"}}]},
    \"fields\": [\"acknowledged\", \"acknowledged_at\"]
  }"
fi

# Teachers: Read all
if [ "$TEACHER_ROLE" != "null" ]; then
  echo "Creating content_reads permissions for Teachers..."
  create_permission "{
    \"role\": \"$TEACHER_ROLE\",
    \"collection\": \"content_reads\",
    \"action\": \"read\",
    \"permissions\": {},
    \"fields\": [\"*\"]
  }"
fi

# Admins: Read all
if [ "$ADMIN_ROLE" != "null" ]; then
  echo "Creating content_reads permissions for Admins..."
  create_permission "{
    \"role\": \"$ADMIN_ROLE\",
    \"collection\": \"content_reads\",
    \"action\": \"read\",
    \"permissions\": {},
    \"fields\": [\"*\"]
  }"
fi

echo ""
echo "=== content_user_status permissions ==="

# Parents: Full CRUD on own status
if [ "$PARENT_ROLE" != "null" ]; then
  echo "Creating content_user_status permissions for Parents..."
  create_permission "{
    \"role\": \"$PARENT_ROLE\",
    \"collection\": \"content_user_status\",
    \"action\": \"create\",
    \"permissions\": {},
    \"fields\": [\"*\"]
  }"
  create_permission "{
    \"role\": \"$PARENT_ROLE\",
    \"collection\": \"content_user_status\",
    \"action\": \"read\",
    \"permissions\": {\"_and\": [{\"user_id\": {\"_eq\": \"\$CURRENT_USER\"}}]},
    \"fields\": [\"*\"]
  }"
  create_permission "{
    \"role\": \"$PARENT_ROLE\",
    \"collection\": \"content_user_status\",
    \"action\": \"update\",
    \"permissions\": {\"_and\": [{\"user_id\": {\"_eq\": \"\$CURRENT_USER\"}}]},
    \"fields\": [\"*\"]
  }"
  create_permission "{
    \"role\": \"$PARENT_ROLE\",
    \"collection\": \"content_user_status\",
    \"action\": \"delete\",
    \"permissions\": {\"_and\": [{\"user_id\": {\"_eq\": \"\$CURRENT_USER\"}}]},
    \"fields\": [\"*\"]
  }"
fi

# Teachers: CRUD own status
if [ "$TEACHER_ROLE" != "null" ]; then
  echo "Creating content_user_status permissions for Teachers..."
  for action in create read update delete; do
    create_permission "{
      \"role\": \"$TEACHER_ROLE\",
      \"collection\": \"content_user_status\",
      \"action\": \"$action\",
      \"permissions\": {\"_and\": [{\"user_id\": {\"_eq\": \"\$CURRENT_USER\"}}]},
      \"fields\": [\"*\"]
    }"
  done
fi

# Admins: Full CRUD
if [ "$ADMIN_ROLE" != "null" ]; then
  echo "Creating content_user_status permissions for Admins..."
  for action in create read update delete; do
    create_permission "{
      \"role\": \"$ADMIN_ROLE\",
      \"collection\": \"content_user_status\",
      \"action\": \"$action\",
      \"permissions\": {},
      \"fields\": [\"*\"]
    }"
  done
fi

echo ""
echo "=== levels permissions ==="

# All roles: Read
for role_var in PARENT_ROLE TEACHER_ROLE ADMIN_ROLE; do
  role_id="${!role_var}"
  if [ "$role_id" != "null" ]; then
    echo "Creating levels read permission for $role_var..."
    create_permission "{
      \"role\": \"$role_id\",
      \"collection\": \"levels\",
      \"action\": \"read\",
      \"permissions\": {},
      \"fields\": [\"*\"]
    }"
  fi
done

# Teachers and Admins: Full CRUD
for role_var in TEACHER_ROLE ADMIN_ROLE; do
  role_id="${!role_var}"
  if [ "$role_id" != "null" ]; then
    echo "Creating levels CRUD permissions for $role_var..."
    for action in create update delete; do
      create_permission "{
        \"role\": \"$role_id\",
        \"collection\": \"levels\",
        \"action\": \"$action\",
        \"permissions\": {},
        \"fields\": [\"*\"]
      }"
    done
  fi
done

echo ""
echo "=== Permissions setup completed! ==="
echo ""
echo "Summary:"
echo "  content_targets: Parents=Read, Teachers/Admins=CRUD"
echo "  attachments: Parents=Read, Teachers/Admins=CRUD"
echo "  content_reads: Parents=Create+Read/Update own, Teachers/Admins=Read all"
echo "  content_user_status: All roles=CRUD own records"
echo "  levels: All roles=Read, Teachers/Admins=CRUD"
