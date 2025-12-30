#!/bin/bash

# Configure Directus UI - Issue #2: Mejoras de configuración CMS
# This script configures icons, colors, groups, display templates, and archive fields

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
echo "Configuring Directus UI (Issue #2)"
echo "============================================"

# Helper function to update collection metadata
update_collection_meta() {
  local collection=$1
  local meta=$2

  echo "Updating collection: $collection"

  curl -s -X PATCH "$API/collections/$collection" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{\"meta\": $meta}" | jq -r '.data.collection // .errors[0].message // "Success"'
}

echo ""
echo "=== Step 1: Configuring Icons and Colors ==="

# Structure group
update_collection_meta "organizations" '{"icon": "domain", "color": "#6366F1", "note": "Colegios/Tenants del sistema"}'
update_collection_meta "grades" '{"icon": "format_list_numbered", "color": "#8B5CF6", "note": "Grados: 1ro, 2do, 3ro..."}'
update_collection_meta "sections" '{"icon": "class", "color": "#A855F7", "note": "Divisiones: A, B, C..."}'
update_collection_meta "locations" '{"icon": "place", "color": "#EC4899", "note": "Lugares físicos del colegio"}'

# People group
update_collection_meta "app_users" '{"icon": "people", "color": "#F59E0B", "note": "Usuarios: admin, teachers, parents, staff"}'
update_collection_meta "students" '{"icon": "school", "color": "#10B981", "note": "Alumnos del colegio"}'
update_collection_meta "student_guardians" '{"icon": "family_restroom", "color": "#14B8A6", "note": "Relación alumno-tutor"}'

# Communication group
update_collection_meta "announcements" '{"icon": "campaign", "color": "#EF4444", "note": "Novedades y comunicados"}'
update_collection_meta "events" '{"icon": "event", "color": "#F97316", "note": "Eventos con confirmación"}'
update_collection_meta "conversations" '{"icon": "forum", "color": "#3B82F6", "note": "Conversaciones de mensajería"}'
update_collection_meta "conversation_participants" '{"icon": "group", "color": "#60A5FA", "note": "Participantes de conversaciones"}'
update_collection_meta "conversation_messages" '{"icon": "chat", "color": "#93C5FD", "note": "Mensajes en conversaciones"}'
update_collection_meta "messages" '{"icon": "mail", "color": "#2563EB", "note": "Mensajes broadcast (legacy)"}'
update_collection_meta "message_reads" '{"icon": "mark_email_read", "color": "#60A5FA", "note": "Lecturas de mensajes", "hidden": true}'
update_collection_meta "pickup_requests" '{"icon": "transfer_within_a_station", "color": "#06B6D4", "note": "Cambios de salida"}'
update_collection_meta "reports" '{"icon": "description", "color": "#84CC16", "note": "Boletines e informes"}'

# Events group (junction)
update_collection_meta "event_responses" '{"icon": "how_to_reg", "color": "#FB923C", "note": "Respuestas a eventos", "hidden": true}'

# Extensibility group
update_collection_meta "custom_field_definitions" '{"icon": "tune", "color": "#64748B", "note": "Metadata de campos custom"}'
update_collection_meta "custom_tables" '{"icon": "table_chart", "color": "#475569", "note": "Registro de tablas custom"}'

# Read status
update_collection_meta "content_reads" '{"icon": "visibility", "color": "#94A3B8", "note": "Estado de lectura de contenido", "hidden": true}'
update_collection_meta "push_tokens" '{"icon": "notifications", "color": "#CBD5E1", "note": "Tokens de push notifications", "hidden": true}'

echo ""
echo "=== Step 2: Configuring Collection Groups ==="

# Create folder structure using collection groups
# Note: Directus groups are created by setting a 'group' property on collections

# Structure folder
for coll in organizations grades sections locations; do
  curl -s -X PATCH "$API/collections/$coll" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"meta": {"group": "estructura"}}' > /dev/null
done
echo "Created 'Estructura' group"

# People folder
for coll in app_users students student_guardians; do
  curl -s -X PATCH "$API/collections/$coll" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"meta": {"group": "personas"}}' > /dev/null
done
echo "Created 'Personas' group"

# Communication folder
for coll in announcements events conversations conversation_participants conversation_messages messages pickup_requests reports; do
  curl -s -X PATCH "$API/collections/$coll" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"meta": {"group": "comunicacion"}}' > /dev/null
done
echo "Created 'Comunicación' group"

# Extensibility folder
for coll in custom_field_definitions custom_tables; do
  curl -s -X PATCH "$API/collections/$coll" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"meta": {"group": "extensibilidad"}}' > /dev/null
done
echo "Created 'Extensibilidad' group"

echo ""
echo "=== Step 3: Configuring Display Templates ==="

# Helper to set display template
set_display_template() {
  local collection=$1
  local template=$2

  echo "Setting display template for $collection: $template"
  curl -s -X PATCH "$API/collections/$collection" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{\"meta\": {\"display_template\": \"$template\"}}" > /dev/null
}

set_display_template "organizations" "{{name}}"
set_display_template "app_users" "{{first_name}} {{last_name}}"
set_display_template "students" "{{first_name}} {{last_name}}"
set_display_template "student_guardians" "{{user_id.first_name}} → {{student_id.first_name}}"
set_display_template "grades" "{{name}}"
set_display_template "sections" "{{grade_id.name}} - {{name}}"
set_display_template "locations" "{{name}} ({{type}})"
set_display_template "announcements" "{{title}}"
set_display_template "events" "{{title}} - {{start_date}}"
set_display_template "conversations" "{{subject}}"
set_display_template "conversation_messages" "{{sender_id.first_name}}: {{content}}"
set_display_template "messages" "{{subject}}"
set_display_template "pickup_requests" "{{student_id.first_name}} - {{pickup_date}}"
set_display_template "reports" "{{title}} - {{student_id.first_name}}"

echo ""
echo "=== Step 4: Configuring Archive and Sort Fields ==="

# Configure archive fields for soft delete functionality
configure_archive() {
  local collection=$1
  local archive_field=$2
  local archive_value=$3
  local unarchive_value=$4

  echo "Configuring archive for $collection ($archive_field)"
  curl -s -X PATCH "$API/collections/$collection" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{\"meta\": {\"archive_field\": \"$archive_field\", \"archive_value\": \"$archive_value\", \"unarchive_value\": \"$unarchive_value\"}}" > /dev/null
}

configure_archive "announcements" "status" "archived" "draft"
configure_archive "events" "status" "cancelled" "draft"
configure_archive "conversations" "status" "archived" "open"
configure_archive "messages" "status" "archived" "sent"
configure_archive "app_users" "status" "inactive" "active"
configure_archive "students" "status" "inactive" "active"
configure_archive "pickup_requests" "status" "rejected" "pending"
configure_archive "organizations" "status" "suspended" "active"

# Configure sort field for grades
echo "Configuring sort field for grades"
curl -s -X PATCH "$API/collections/grades" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{"meta": {"sort_field": "order"}}' > /dev/null

echo ""
echo "=== Step 5: Hiding Junction Tables ==="

# Already done in Step 1, but explicitly confirm
for coll in event_responses message_reads content_reads push_tokens; do
  curl -s -X PATCH "$API/collections/$coll" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{"meta": {"hidden": true}}' > /dev/null
  echo "Hidden: $coll"
done

echo ""
echo "============================================"
echo "Directus UI Configuration Complete!"
echo "============================================"
echo ""
echo "Summary:"
echo "  - Icons and colors: 20 collections configured"
echo "  - Groups: 4 folders created (Estructura, Personas, Comunicación, Extensibilidad)"
echo "  - Display templates: 14 collections configured"
echo "  - Archive fields: 8 collections configured"
echo "  - Sort field: grades.order"
echo "  - Hidden tables: 4 junction tables"
echo ""
echo "Check Directus admin at: $DIRECTUS_URL"
