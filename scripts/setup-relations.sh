#!/bin/bash

# Setup Relations for Kairos
DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found."
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "Creating relations..."

# Helper function
create_relation() {
  local data=$1
  echo "Creating relation..."
  curl -s -X POST "$API/relations" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "$data" | jq -r '.data.collection // .errors[0].message // "created"'
}

# app_users -> organizations
create_relation '{
  "collection": "app_users",
  "field": "organization_id",
  "related_collection": "organizations",
  "meta": {"one_field": "users", "one_deselect_action": "nullify"},
  "schema": {"on_delete": "SET NULL"}
}'

# students -> organizations
create_relation '{
  "collection": "students",
  "field": "organization_id",
  "related_collection": "organizations",
  "meta": {"one_field": "students", "one_deselect_action": "nullify"},
  "schema": {"on_delete": "SET NULL"}
}'

# students -> sections
create_relation '{
  "collection": "students",
  "field": "section_id",
  "related_collection": "sections",
  "meta": {"one_field": "students", "one_deselect_action": "nullify"},
  "schema": {"on_delete": "SET NULL"}
}'

# student_guardians -> students
create_relation '{
  "collection": "student_guardians",
  "field": "student_id",
  "related_collection": "students",
  "meta": {"one_field": "guardians", "one_deselect_action": "nullify"},
  "schema": {"on_delete": "CASCADE"}
}'

# student_guardians -> app_users
create_relation '{
  "collection": "student_guardians",
  "field": "user_id",
  "related_collection": "app_users",
  "meta": {"one_field": "children", "one_deselect_action": "nullify"},
  "schema": {"on_delete": "CASCADE"}
}'

# grades -> organizations
create_relation '{
  "collection": "grades",
  "field": "organization_id",
  "related_collection": "organizations",
  "meta": {"one_field": "grades", "one_deselect_action": "nullify"},
  "schema": {"on_delete": "SET NULL"}
}'

# sections -> organizations
create_relation '{
  "collection": "sections",
  "field": "organization_id",
  "related_collection": "organizations",
  "schema": {"on_delete": "SET NULL"}
}'

# sections -> grades
create_relation '{
  "collection": "sections",
  "field": "grade_id",
  "related_collection": "grades",
  "meta": {"one_field": "sections", "one_deselect_action": "nullify"},
  "schema": {"on_delete": "SET NULL"}
}'

# sections -> app_users (teacher)
create_relation '{
  "collection": "sections",
  "field": "teacher_id",
  "related_collection": "app_users",
  "schema": {"on_delete": "SET NULL"}
}'

# locations -> organizations
create_relation '{
  "collection": "locations",
  "field": "organization_id",
  "related_collection": "organizations",
  "meta": {"one_field": "locations", "one_deselect_action": "nullify"},
  "schema": {"on_delete": "SET NULL"}
}'

# announcements -> organizations
create_relation '{
  "collection": "announcements",
  "field": "organization_id",
  "related_collection": "organizations",
  "schema": {"on_delete": "SET NULL"}
}'

# announcements -> app_users (author)
create_relation '{
  "collection": "announcements",
  "field": "author_id",
  "related_collection": "app_users",
  "schema": {"on_delete": "SET NULL"}
}'

# events -> organizations
create_relation '{
  "collection": "events",
  "field": "organization_id",
  "related_collection": "organizations",
  "schema": {"on_delete": "SET NULL"}
}'

# events -> app_users (author)
create_relation '{
  "collection": "events",
  "field": "author_id",
  "related_collection": "app_users",
  "schema": {"on_delete": "SET NULL"}
}'

# events -> locations
create_relation '{
  "collection": "events",
  "field": "location_id",
  "related_collection": "locations",
  "schema": {"on_delete": "SET NULL"}
}'

# event_responses -> events
create_relation '{
  "collection": "event_responses",
  "field": "event_id",
  "related_collection": "events",
  "meta": {"one_field": "responses", "one_deselect_action": "nullify"},
  "schema": {"on_delete": "CASCADE"}
}'

# event_responses -> students
create_relation '{
  "collection": "event_responses",
  "field": "student_id",
  "related_collection": "students",
  "schema": {"on_delete": "CASCADE"}
}'

# event_responses -> app_users
create_relation '{
  "collection": "event_responses",
  "field": "user_id",
  "related_collection": "app_users",
  "schema": {"on_delete": "SET NULL"}
}'

# messages -> organizations
create_relation '{
  "collection": "messages",
  "field": "organization_id",
  "related_collection": "organizations",
  "schema": {"on_delete": "SET NULL"}
}'

# messages -> messages (parent for threads)
create_relation '{
  "collection": "messages",
  "field": "parent_id",
  "related_collection": "messages",
  "meta": {"one_field": "replies", "one_deselect_action": "nullify"},
  "schema": {"on_delete": "CASCADE"}
}'

# messages -> app_users (author)
create_relation '{
  "collection": "messages",
  "field": "author_id",
  "related_collection": "app_users",
  "schema": {"on_delete": "SET NULL"}
}'

# message_reads -> messages
create_relation '{
  "collection": "message_reads",
  "field": "message_id",
  "related_collection": "messages",
  "schema": {"on_delete": "CASCADE"}
}'

# message_reads -> app_users
create_relation '{
  "collection": "message_reads",
  "field": "user_id",
  "related_collection": "app_users",
  "schema": {"on_delete": "CASCADE"}
}'

# pickup_requests -> organizations
create_relation '{
  "collection": "pickup_requests",
  "field": "organization_id",
  "related_collection": "organizations",
  "schema": {"on_delete": "SET NULL"}
}'

# pickup_requests -> students
create_relation '{
  "collection": "pickup_requests",
  "field": "student_id",
  "related_collection": "students",
  "schema": {"on_delete": "CASCADE"}
}'

# pickup_requests -> app_users (requested_by)
create_relation '{
  "collection": "pickup_requests",
  "field": "requested_by",
  "related_collection": "app_users",
  "schema": {"on_delete": "SET NULL"}
}'

# pickup_requests -> app_users (reviewed_by)
create_relation '{
  "collection": "pickup_requests",
  "field": "reviewed_by",
  "related_collection": "app_users",
  "schema": {"on_delete": "SET NULL"}
}'

# reports -> organizations
create_relation '{
  "collection": "reports",
  "field": "organization_id",
  "related_collection": "organizations",
  "schema": {"on_delete": "SET NULL"}
}'

# reports -> students
create_relation '{
  "collection": "reports",
  "field": "student_id",
  "related_collection": "students",
  "meta": {"one_field": "reports", "one_deselect_action": "nullify"},
  "schema": {"on_delete": "CASCADE"}
}'

# reports -> app_users (author)
create_relation '{
  "collection": "reports",
  "field": "author_id",
  "related_collection": "app_users",
  "schema": {"on_delete": "SET NULL"}
}'

# custom_field_definitions -> organizations
create_relation '{
  "collection": "custom_field_definitions",
  "field": "organization_id",
  "related_collection": "organizations",
  "schema": {"on_delete": "CASCADE"}
}'

# custom_tables -> organizations
create_relation '{
  "collection": "custom_tables",
  "field": "organization_id",
  "related_collection": "organizations",
  "schema": {"on_delete": "CASCADE"}
}'

echo ""
echo "Relations created!"
