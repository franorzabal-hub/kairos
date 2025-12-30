#!/bin/bash

# Configure Directus Phase 2 - Issue #3: Mejoras avanzadas
# This script configures field validations, audit fields, and O2M relations

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
echo "Configuring Directus Phase 2 (Issue #3)"
echo "============================================"

# Helper function to add field validation
add_validation() {
  local collection=$1
  local field=$2
  local validation=$3
  local message=$4

  echo "Adding validation to $collection.$field"

  # Get current field meta
  current_meta=$(curl -s "$API/fields/$collection/$field" -H "$AUTH" | jq '.data.meta // {}')

  # Update with validation
  curl -s -X PATCH "$API/fields/$collection/$field" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{
      \"meta\": {
        \"validation\": $validation,
        \"validation_message\": \"$message\"
      }
    }" | jq -r '.data.field // .errors[0].message // "Success"'
}

# Helper to add a field to a collection
add_field() {
  local collection=$1
  local field_name=$2
  local field_type=$3
  local field_meta=$4

  echo "Adding field $field_name to $collection"

  curl -s -X POST "$API/fields/$collection" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{
      \"field\": \"$field_name\",
      \"type\": \"$field_type\",
      \"meta\": $field_meta
    }" | jq -r '.data.field // .errors[0].message // "Success"'
}

# Helper to add O2M relation
add_o2m_relation() {
  local one_collection=$1
  local one_field=$2
  local many_collection=$3
  local many_field=$4

  echo "Adding O2M: $one_collection.$one_field -> $many_collection.$many_field"

  curl -s -X POST "$API/relations" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{
      \"collection\": \"$many_collection\",
      \"field\": \"$many_field\",
      \"related_collection\": \"$one_collection\",
      \"meta\": {
        \"one_field\": \"$one_field\"
      },
      \"schema\": {
        \"on_delete\": \"SET NULL\"
      }
    }" | jq -r '.data.field // .errors[0].message // "Success"'
}

echo ""
echo "=== Step 1: Adding Field Validations ==="

# Slug validation (lowercase, numbers, hyphens)
add_validation "organizations" "slug" \
  '{"_regex": "^[a-z0-9]+(?:-[a-z0-9]+)*$"}' \
  "Solo minúsculas, números y guiones"

# Email validation
add_validation "organizations" "email" \
  '{"_regex": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"}' \
  "Email inválido"

add_validation "app_users" "email" \
  '{"_regex": "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"}' \
  "Email inválido"

# Phone validation (optional + and 8-15 digits)
add_validation "organizations" "phone" \
  '{"_regex": "^\\+?[0-9]{8,15}$"}' \
  "Teléfono inválido (8-15 dígitos)"

add_validation "app_users" "phone" \
  '{"_regex": "^\\+?[0-9]{8,15}$"}' \
  "Teléfono inválido (8-15 dígitos)"

# DNI validation (7-8 digits)
add_validation "students" "dni" \
  '{"_regex": "^[0-9]{7,8}$"}' \
  "DNI debe tener 7-8 dígitos"

add_validation "pickup_requests" "authorized_dni" \
  '{"_regex": "^[0-9]{7,8}$"}' \
  "DNI debe tener 7-8 dígitos"

echo ""
echo "=== Step 2: Adding Audit Fields ==="

# Add missing audit fields to collections that need them

# For grades
add_field "grades" "date_created" "timestamp" '{
  "interface": "datetime",
  "special": ["date-created"],
  "readonly": true,
  "hidden": true
}'

add_field "grades" "date_updated" "timestamp" '{
  "interface": "datetime",
  "special": ["date-updated"],
  "readonly": true,
  "hidden": true
}'

add_field "grades" "user_created" "uuid" '{
  "interface": "select-dropdown-m2o",
  "special": ["user-created", "m2o"],
  "readonly": true,
  "hidden": true
}'

add_field "grades" "user_updated" "uuid" '{
  "interface": "select-dropdown-m2o",
  "special": ["user-updated", "m2o"],
  "readonly": true,
  "hidden": true
}'

# For sections
add_field "sections" "date_created" "timestamp" '{
  "interface": "datetime",
  "special": ["date-created"],
  "readonly": true,
  "hidden": true
}'

add_field "sections" "date_updated" "timestamp" '{
  "interface": "datetime",
  "special": ["date-updated"],
  "readonly": true,
  "hidden": true
}'

add_field "sections" "user_created" "uuid" '{
  "interface": "select-dropdown-m2o",
  "special": ["user-created", "m2o"],
  "readonly": true,
  "hidden": true
}'

add_field "sections" "user_updated" "uuid" '{
  "interface": "select-dropdown-m2o",
  "special": ["user-updated", "m2o"],
  "readonly": true,
  "hidden": true
}'

# For locations
add_field "locations" "date_created" "timestamp" '{
  "interface": "datetime",
  "special": ["date-created"],
  "readonly": true,
  "hidden": true
}'

add_field "locations" "date_updated" "timestamp" '{
  "interface": "datetime",
  "special": ["date-updated"],
  "readonly": true,
  "hidden": true
}'

add_field "locations" "user_created" "uuid" '{
  "interface": "select-dropdown-m2o",
  "special": ["user-created", "m2o"],
  "readonly": true,
  "hidden": true
}'

add_field "locations" "user_updated" "uuid" '{
  "interface": "select-dropdown-m2o",
  "special": ["user-updated", "m2o"],
  "readonly": true,
  "hidden": true
}'

# For student_guardians
add_field "student_guardians" "date_updated" "timestamp" '{
  "interface": "datetime",
  "special": ["date-updated"],
  "readonly": true,
  "hidden": true
}'

add_field "student_guardians" "user_created" "uuid" '{
  "interface": "select-dropdown-m2o",
  "special": ["user-created", "m2o"],
  "readonly": true,
  "hidden": true
}'

add_field "student_guardians" "user_updated" "uuid" '{
  "interface": "select-dropdown-m2o",
  "special": ["user-updated", "m2o"],
  "readonly": true,
  "hidden": true
}'

echo ""
echo "=== Step 3: Adding O2M Relations ==="

# These create the "reverse" side of M2O relations for easier navigation in Directus admin

# organizations -> app_users
add_field "organizations" "users" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{first_name}} {{last_name}}"
  }
}'

# organizations -> students
add_field "organizations" "students" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{first_name}} {{last_name}}"
  }
}'

# organizations -> grades
add_field "organizations" "grades_list" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{name}}"
  }
}'

# organizations -> announcements
add_field "organizations" "announcements" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{title}}"
  }
}'

# grades -> sections
add_field "grades" "sections" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{name}}"
  }
}'

# sections -> students (students in this section)
add_field "sections" "students" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{first_name}} {{last_name}}"
  }
}'

# students -> guardians
add_field "students" "guardians" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{user_id.first_name}} {{user_id.last_name}}"
  }
}'

# students -> pickup_requests
add_field "students" "pickup_requests_list" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{pickup_date}} - {{status}}"
  }
}'

# students -> reports
add_field "students" "reports" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{title}}"
  }
}'

# app_users -> children (via student_guardians)
add_field "app_users" "children" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{student_id.first_name}} {{student_id.last_name}}"
  }
}'

# conversations -> participants
add_field "conversations" "participants" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{user_id.first_name}} {{user_id.last_name}}"
  }
}'

# conversations -> messages
add_field "conversations" "messages" "alias" '{
  "interface": "list-o2m",
  "special": ["o2m"],
  "options": {
    "template": "{{content}}"
  }
}'

echo ""
echo "============================================"
echo "Directus Phase 2 Configuration Complete!"
echo "============================================"
echo ""
echo "Summary:"
echo "  - Field validations: 7 fields (slug, email, phone, dni)"
echo "  - Audit fields: 4 collections (grades, sections, locations, student_guardians)"
echo "  - O2M relations: 12 reverse relations for easier navigation"
echo ""
echo "NOTE: The following still require manual configuration in Directus Admin:"
echo "  - Flows/Automations (notifications)"
echo "  - Access Policies (multi-tenant)"
echo "  - Conditional fields (UI conditions)"
echo "  - Dashboards/Insights"
echo "  - Presets/Bookmarks"
echo ""
echo "See: docs/DIRECTUS_MANUAL_CONFIG.md for instructions"
echo ""
echo "Check Directus admin at: $DIRECTUS_URL"
