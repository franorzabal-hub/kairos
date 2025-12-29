#!/bin/bash

# Setup Directus Schema for Kairos
# Run this after Directus is deployed

DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found. Run authentication first."
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "Creating collections in Directus..."

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
        \"singleton\": false,
        \"translations\": null,
        \"archive_field\": null,
        \"archive_value\": \"archived\",
        \"unarchive_value\": \"draft\",
        \"sort_field\": null
      },
      \"schema\": {},
      \"fields\": $fields
    }" | jq -r '.data.collection // .errors[0].message'
}

# 1. Organizations
create_collection "organizations" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true, "has_auto_increment": false}},
  {"field": "name", "type": "string", "meta": {"interface": "input", "required": true}, "schema": {"is_nullable": false}},
  {"field": "slug", "type": "string", "meta": {"interface": "input", "required": true}, "schema": {"is_unique": true}},
  {"field": "logo", "type": "uuid", "meta": {"interface": "file-image", "special": ["file"]}},
  {"field": "address", "type": "string", "meta": {"interface": "input"}},
  {"field": "phone", "type": "string", "meta": {"interface": "input"}},
  {"field": "email", "type": "string", "meta": {"interface": "input"}},
  {"field": "settings", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "plan", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Free", "value": "free"}, {"text": "Basic", "value": "basic"}, {"text": "Premium", "value": "premium"}]}}, "schema": {"default_value": "free"}},
  {"field": "status", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Active", "value": "active"}, {"text": "Inactive", "value": "inactive"}, {"text": "Suspended", "value": "suspended"}]}}, "schema": {"default_value": "active"}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}},
  {"field": "updated_at", "type": "timestamp", "meta": {"special": ["date-updated"], "interface": "datetime", "readonly": true}}
]'

# 2. Users (extends directus_users)
create_collection "app_users" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "directus_user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"]}},
  {"field": "role", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Admin", "value": "admin"}, {"text": "Teacher", "value": "teacher"}, {"text": "Parent", "value": "parent"}, {"text": "Staff", "value": "staff"}]}, "required": true}},
  {"field": "first_name", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "last_name", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "email", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "phone", "type": "string", "meta": {"interface": "input"}},
  {"field": "avatar", "type": "uuid", "meta": {"interface": "file-image", "special": ["file"]}},
  {"field": "custom_fields", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "status", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Active", "value": "active"}, {"text": "Inactive", "value": "inactive"}]}}, "schema": {"default_value": "active"}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# 3. Students
create_collection "students" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "first_name", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "last_name", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "birth_date", "type": "date", "meta": {"interface": "datetime"}},
  {"field": "dni", "type": "string", "meta": {"interface": "input"}},
  {"field": "section_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"]}},
  {"field": "photo", "type": "uuid", "meta": {"interface": "file-image", "special": ["file"]}},
  {"field": "medical_info", "type": "text", "meta": {"interface": "input-multiline"}},
  {"field": "custom_fields", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "status", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Active", "value": "active"}, {"text": "Inactive", "value": "inactive"}, {"text": "Graduated", "value": "graduated"}]}}, "schema": {"default_value": "active"}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# 4. Student Guardians
create_collection "student_guardians" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "student_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "relationship", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Mother", "value": "mother"}, {"text": "Father", "value": "father"}, {"text": "Guardian", "value": "guardian"}, {"text": "Other", "value": "other"}]}}},
  {"field": "is_primary", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}},
  {"field": "can_pickup", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": true}},
  {"field": "custom_fields", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# 5. Grades
create_collection "grades" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "name", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "level", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Initial", "value": "initial"}, {"text": "Primary", "value": "primary"}, {"text": "Secondary", "value": "secondary"}]}}},
  {"field": "order", "type": "integer", "meta": {"interface": "input"}, "schema": {"default_value": 0}}
]'

# 6. Sections
create_collection "sections" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "grade_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "name", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "teacher_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"]}},
  {"field": "school_year", "type": "integer", "meta": {"interface": "input"}, "schema": {"default_value": 2025}},
  {"field": "capacity", "type": "integer", "meta": {"interface": "input"}},
  {"field": "custom_fields", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}}
]'

# 7. Locations
create_collection "locations" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "name", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Classroom", "value": "classroom"}, {"text": "Gym", "value": "gym"}, {"text": "Auditorium", "value": "auditorium"}, {"text": "Outdoor", "value": "outdoor"}, {"text": "Office", "value": "office"}]}}},
  {"field": "capacity", "type": "integer", "meta": {"interface": "input"}},
  {"field": "custom_fields", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}}
]'

# 8. Announcements
create_collection "announcements" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "author_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "title", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "content", "type": "text", "meta": {"interface": "input-rich-text-html"}},
  {"field": "priority", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Normal", "value": "normal"}, {"text": "Important", "value": "important"}, {"text": "Urgent", "value": "urgent"}]}}, "schema": {"default_value": "normal"}},
  {"field": "target_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "All", "value": "all"}, {"text": "Grade", "value": "grade"}, {"text": "Section", "value": "section"}]}}, "schema": {"default_value": "all"}},
  {"field": "target_id", "type": "uuid", "meta": {"interface": "input"}},
  {"field": "publish_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "expires_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "custom_fields", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "status", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Draft", "value": "draft"}, {"text": "Published", "value": "published"}, {"text": "Archived", "value": "archived"}]}}, "schema": {"default_value": "draft"}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# 9. Events
create_collection "events" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "author_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "title", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "description", "type": "text", "meta": {"interface": "input-rich-text-html"}},
  {"field": "location_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"]}},
  {"field": "location_external", "type": "string", "meta": {"interface": "input"}},
  {"field": "start_date", "type": "timestamp", "meta": {"interface": "datetime", "required": true}},
  {"field": "end_date", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "all_day", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}},
  {"field": "requires_confirmation", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}},
  {"field": "confirmation_deadline", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "target_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "All", "value": "all"}, {"text": "Grade", "value": "grade"}, {"text": "Section", "value": "section"}]}}, "schema": {"default_value": "all"}},
  {"field": "target_id", "type": "uuid", "meta": {"interface": "input"}},
  {"field": "custom_fields", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "status", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Draft", "value": "draft"}, {"text": "Published", "value": "published"}, {"text": "Cancelled", "value": "cancelled"}]}}, "schema": {"default_value": "draft"}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# 10. Event Responses
create_collection "event_responses" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "event_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "student_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "response", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Attending", "value": "attending"}, {"text": "Not Attending", "value": "not_attending"}, {"text": "Maybe", "value": "maybe"}]}, "required": true}},
  {"field": "notes", "type": "text", "meta": {"interface": "input-multiline"}},
  {"field": "responded_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# 11. Messages
create_collection "messages" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "parent_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"]}},
  {"field": "author_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "subject", "type": "string", "meta": {"interface": "input"}},
  {"field": "content", "type": "text", "meta": {"interface": "input-rich-text-html", "required": true}},
  {"field": "target_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "All", "value": "all"}, {"text": "Grade", "value": "grade"}, {"text": "Section", "value": "section"}, {"text": "User", "value": "user"}]}}, "schema": {"default_value": "all"}},
  {"field": "target_id", "type": "uuid", "meta": {"interface": "input"}},
  {"field": "allow_replies", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": true}},
  {"field": "custom_fields", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "status", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Sent", "value": "sent"}, {"text": "Archived", "value": "archived"}]}}, "schema": {"default_value": "sent"}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# 12. Message Reads
create_collection "message_reads" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "message_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "user_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "read_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# 13. Pickup Requests
create_collection "pickup_requests" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "student_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "requested_by", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "request_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Different Time", "value": "different_time"}, {"text": "Different Person", "value": "different_person"}, {"text": "Both", "value": "both"}]}, "required": true}},
  {"field": "pickup_date", "type": "date", "meta": {"interface": "datetime", "required": true}},
  {"field": "pickup_time", "type": "time", "meta": {"interface": "datetime"}},
  {"field": "authorized_person", "type": "string", "meta": {"interface": "input"}},
  {"field": "authorized_dni", "type": "string", "meta": {"interface": "input"}},
  {"field": "authorized_relationship", "type": "string", "meta": {"interface": "input"}},
  {"field": "reason", "type": "text", "meta": {"interface": "input-multiline"}},
  {"field": "status", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Pending", "value": "pending"}, {"text": "Approved", "value": "approved"}, {"text": "Rejected", "value": "rejected"}]}}, "schema": {"default_value": "pending"}},
  {"field": "reviewed_by", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"]}},
  {"field": "reviewed_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "notes", "type": "text", "meta": {"interface": "input-multiline"}},
  {"field": "custom_fields", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# 14. Reports
create_collection "reports" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "student_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "author_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Report Card", "value": "report_card"}, {"text": "Progress", "value": "progress"}, {"text": "Behavior", "value": "behavior"}, {"text": "Other", "value": "other"}]}, "required": true}},
  {"field": "title", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "period", "type": "string", "meta": {"interface": "input"}},
  {"field": "content", "type": "text", "meta": {"interface": "input-rich-text-html"}},
  {"field": "file", "type": "uuid", "meta": {"interface": "file", "special": ["file"]}},
  {"field": "visible_to_parents", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}},
  {"field": "custom_fields", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "published_at", "type": "timestamp", "meta": {"interface": "datetime"}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}}
]'

# 15. Custom Field Definitions
create_collection "custom_field_definitions" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "target_table", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "field_name", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "field_label", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "field_type", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Text", "value": "text"}, {"text": "Number", "value": "number"}, {"text": "Date", "value": "date"}, {"text": "Boolean", "value": "boolean"}, {"text": "Select", "value": "select"}, {"text": "Multi Select", "value": "multiselect"}]}, "required": true}},
  {"field": "field_options", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "is_required", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}},
  {"field": "is_searchable", "type": "boolean", "meta": {"interface": "boolean"}, "schema": {"default_value": false}},
  {"field": "display_order", "type": "integer", "meta": {"interface": "input"}, "schema": {"default_value": 0}},
  {"field": "status", "type": "string", "meta": {"interface": "select-dropdown", "options": {"choices": [{"text": "Active", "value": "active"}, {"text": "Inactive", "value": "inactive"}]}}, "schema": {"default_value": "active"}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}},
  {"field": "updated_at", "type": "timestamp", "meta": {"special": ["date-updated"], "interface": "datetime", "readonly": true}}
]'

# 16. Custom Tables
create_collection "custom_tables" '[
  {"field": "id", "type": "uuid", "meta": {"special": ["uuid"], "interface": "input", "readonly": true, "hidden": true}, "schema": {"is_primary_key": true}},
  {"field": "organization_id", "type": "uuid", "meta": {"interface": "select-dropdown-m2o", "special": ["m2o"], "required": true}},
  {"field": "table_name", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "table_label", "type": "string", "meta": {"interface": "input", "required": true}},
  {"field": "description", "type": "text", "meta": {"interface": "input-multiline"}},
  {"field": "icon", "type": "string", "meta": {"interface": "input"}},
  {"field": "schema_definition", "type": "json", "meta": {"interface": "input-code", "options": {"language": "json"}}},
  {"field": "created_at", "type": "timestamp", "meta": {"special": ["date-created"], "interface": "datetime", "readonly": true}},
  {"field": "updated_at", "type": "timestamp", "meta": {"special": ["date-updated"], "interface": "datetime", "readonly": true}}
]'

echo ""
echo "Schema creation completed!"
echo "Check Directus admin at: $DIRECTUS_URL"
