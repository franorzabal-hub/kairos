#!/bin/bash

# Seed data for Kairos
DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found."
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "Creating seed data..."

# 1. Create demo organization
echo "Creating organization..."
ORG_ID=$(curl -s -X POST "$API/items/organizations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Colegio Demo San Martín",
    "slug": "demo-san-martin",
    "address": "Av. Corrientes 1234, Buenos Aires",
    "phone": "+54 11 4567-8900",
    "email": "info@colegiosanmartin.edu.ar",
    "settings": {
      "timezone": "America/Argentina/Buenos_Aires",
      "school_hours": {"start": "08:00", "end": "16:00"},
      "default_pickup_time": "16:00"
    },
    "plan": "premium",
    "status": "active"
  }' | jq -r '.data.id')
echo "Organization ID: $ORG_ID"

# 2. Create grades
echo "Creating grades..."
GRADE_1=$(curl -s -X POST "$API/items/grades" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"organization_id\": \"$ORG_ID\", \"name\": \"1er Grado\", \"level\": \"primary\", \"order\": 1}" | jq -r '.data.id')

GRADE_2=$(curl -s -X POST "$API/items/grades" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"organization_id\": \"$ORG_ID\", \"name\": \"2do Grado\", \"level\": \"primary\", \"order\": 2}" | jq -r '.data.id')

GRADE_3=$(curl -s -X POST "$API/items/grades" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"organization_id\": \"$ORG_ID\", \"name\": \"3er Grado\", \"level\": \"primary\", \"order\": 3}" | jq -r '.data.id')

echo "Grades created: $GRADE_1, $GRADE_2, $GRADE_3"

# 3. Create sections
echo "Creating sections..."
SECTION_1A=$(curl -s -X POST "$API/items/sections" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"organization_id\": \"$ORG_ID\", \"grade_id\": \"$GRADE_1\", \"name\": \"A\", \"school_year\": 2025, \"capacity\": 30}" | jq -r '.data.id')

SECTION_1B=$(curl -s -X POST "$API/items/sections" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"organization_id\": \"$ORG_ID\", \"grade_id\": \"$GRADE_1\", \"name\": \"B\", \"school_year\": 2025, \"capacity\": 30}" | jq -r '.data.id')

SECTION_2A=$(curl -s -X POST "$API/items/sections" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"organization_id\": \"$ORG_ID\", \"grade_id\": \"$GRADE_2\", \"name\": \"A\", \"school_year\": 2025, \"capacity\": 30}" | jq -r '.data.id')

echo "Sections created"

# 4. Create locations
echo "Creating locations..."
curl -s -X POST "$API/items/locations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"organization_id\": \"$ORG_ID\", \"name\": \"Aula 101\", \"type\": \"classroom\", \"capacity\": 35}" > /dev/null

curl -s -X POST "$API/items/locations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"organization_id\": \"$ORG_ID\", \"name\": \"Patio Principal\", \"type\": \"outdoor\", \"capacity\": 200}" > /dev/null

curl -s -X POST "$API/items/locations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"organization_id\": \"$ORG_ID\", \"name\": \"Salón de Actos\", \"type\": \"auditorium\", \"capacity\": 150}" > /dev/null

curl -s -X POST "$API/items/locations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{\"organization_id\": \"$ORG_ID\", \"name\": \"Gimnasio\", \"type\": \"gym\", \"capacity\": 80}" > /dev/null

echo "Locations created"

# 5. Create users
echo "Creating users..."

# Admin
ADMIN_ID=$(curl -s -X POST "$API/items/app_users" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"role\": \"admin\",
    \"first_name\": \"María\",
    \"last_name\": \"González\",
    \"email\": \"directora@colegiosanmartin.edu.ar\",
    \"phone\": \"+54 11 4567-8901\",
    \"status\": \"active\"
  }" | jq -r '.data.id')

# Teachers
TEACHER_1=$(curl -s -X POST "$API/items/app_users" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"role\": \"teacher\",
    \"first_name\": \"Laura\",
    \"last_name\": \"Martínez\",
    \"email\": \"laura.martinez@colegiosanmartin.edu.ar\",
    \"phone\": \"+54 11 4567-8902\",
    \"status\": \"active\"
  }" | jq -r '.data.id')

TEACHER_2=$(curl -s -X POST "$API/items/app_users" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"role\": \"teacher\",
    \"first_name\": \"Carlos\",
    \"last_name\": \"Rodríguez\",
    \"email\": \"carlos.rodriguez@colegiosanmartin.edu.ar\",
    \"phone\": \"+54 11 4567-8903\",
    \"status\": \"active\"
  }" | jq -r '.data.id')

# Parents
PARENT_1=$(curl -s -X POST "$API/items/app_users" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"role\": \"parent\",
    \"first_name\": \"Juan\",
    \"last_name\": \"Pérez\",
    \"email\": \"juan.perez@gmail.com\",
    \"phone\": \"+54 11 1234-5678\",
    \"status\": \"active\"
  }" | jq -r '.data.id')

PARENT_2=$(curl -s -X POST "$API/items/app_users" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"role\": \"parent\",
    \"first_name\": \"Ana\",
    \"last_name\": \"López\",
    \"email\": \"ana.lopez@gmail.com\",
    \"phone\": \"+54 11 2345-6789\",
    \"status\": \"active\"
  }" | jq -r '.data.id')

echo "Users created"

# 6. Create students
echo "Creating students..."

STUDENT_1=$(curl -s -X POST "$API/items/students" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"first_name\": \"Sofía\",
    \"last_name\": \"Pérez\",
    \"birth_date\": \"2018-03-15\",
    \"dni\": \"12345678\",
    \"section_id\": \"$SECTION_1A\",
    \"medical_info\": \"Sin alergias conocidas\",
    \"status\": \"active\"
  }" | jq -r '.data.id')

STUDENT_2=$(curl -s -X POST "$API/items/students" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"first_name\": \"Mateo\",
    \"last_name\": \"López\",
    \"birth_date\": \"2017-08-22\",
    \"dni\": \"23456789\",
    \"section_id\": \"$SECTION_2A\",
    \"medical_info\": \"Alergia al maní\",
    \"status\": \"active\"
  }" | jq -r '.data.id')

echo "Students created"

# 7. Create student-guardian relations
echo "Creating student-guardian relations..."

curl -s -X POST "$API/items/student_guardians" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"student_id\": \"$STUDENT_1\",
    \"user_id\": \"$PARENT_1\",
    \"relationship\": \"father\",
    \"is_primary\": true,
    \"can_pickup\": true
  }" > /dev/null

curl -s -X POST "$API/items/student_guardians" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"student_id\": \"$STUDENT_2\",
    \"user_id\": \"$PARENT_2\",
    \"relationship\": \"mother\",
    \"is_primary\": true,
    \"can_pickup\": true
  }" > /dev/null

echo "Student-guardian relations created"

# 8. Create announcements
echo "Creating announcements..."

curl -s -X POST "$API/items/announcements" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"author_id\": \"$ADMIN_ID\",
    \"title\": \"Bienvenidos al ciclo lectivo 2025\",
    \"content\": \"<p>Queridas familias,</p><p>Les damos la bienvenida al nuevo ciclo lectivo. Este año tenemos muchas novedades y actividades planificadas.</p><p>Los esperamos el lunes 3 de marzo a las 8:00 hs.</p><p>Saludos cordiales,<br>Dirección</p>\",
    \"priority\": \"important\",
    \"target_type\": \"all\",
    \"status\": \"published\"
  }" > /dev/null

curl -s -X POST "$API/items/announcements" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"author_id\": \"$TEACHER_1\",
    \"title\": \"Lista de materiales 1er Grado\",
    \"content\": \"<p>Estimadas familias de 1er grado,</p><p>Les compartimos la lista de materiales para el año:</p><ul><li>2 cuadernos tapa dura</li><li>1 cartuchera completa</li><li>Plasticola</li><li>Tijera punta roma</li></ul>\",
    \"priority\": \"normal\",
    \"target_type\": \"grade\",
    \"target_id\": \"$GRADE_1\",
    \"status\": \"published\"
  }" > /dev/null

echo "Announcements created"

# 9. Create events
echo "Creating events..."

curl -s -X POST "$API/items/events" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"author_id\": \"$ADMIN_ID\",
    \"title\": \"Acto de inicio de clases\",
    \"description\": \"<p>Los invitamos al acto de inicio del ciclo lectivo 2025.</p><p>Se realizará en el Salón de Actos a las 9:00 hs.</p>\",
    \"start_date\": \"2025-03-03T09:00:00\",
    \"end_date\": \"2025-03-03T10:00:00\",
    \"all_day\": false,
    \"requires_confirmation\": true,
    \"confirmation_deadline\": \"2025-02-28T18:00:00\",
    \"target_type\": \"all\",
    \"status\": \"published\"
  }" > /dev/null

curl -s -X POST "$API/items/events" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"author_id\": \"$TEACHER_1\",
    \"title\": \"Reunión de padres 1er Grado A\",
    \"description\": \"<p>Primera reunión de padres del año para conocernos y compartir objetivos del ciclo.</p>\",
    \"start_date\": \"2025-03-10T18:00:00\",
    \"end_date\": \"2025-03-10T19:00:00\",
    \"all_day\": false,
    \"requires_confirmation\": true,
    \"target_type\": \"section\",
    \"target_id\": \"$SECTION_1A\",
    \"status\": \"published\"
  }" > /dev/null

echo "Events created"

# 10. Create a sample pickup request
echo "Creating sample pickup request..."

curl -s -X POST "$API/items/pickup_requests" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"student_id\": \"$STUDENT_1\",
    \"requested_by\": \"$PARENT_1\",
    \"request_type\": \"different_person\",
    \"pickup_date\": \"2025-03-05\",
    \"pickup_time\": \"16:00:00\",
    \"authorized_person\": \"Roberto Pérez\",
    \"authorized_dni\": \"34567890\",
    \"authorized_relationship\": \"Abuelo\",
    \"reason\": \"Tengo una reunión de trabajo\",
    \"status\": \"pending\"
  }" > /dev/null

echo "Pickup request created"

# 11. Create custom field definitions (example for blood type)
echo "Creating custom field definitions..."

curl -s -X POST "$API/items/custom_field_definitions" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"target_table\": \"students\",
    \"field_name\": \"blood_type\",
    \"field_label\": \"Grupo Sanguíneo\",
    \"field_type\": \"select\",
    \"field_options\": {
      \"options\": [\"O+\", \"O-\", \"A+\", \"A-\", \"B+\", \"B-\", \"AB+\", \"AB-\"],
      \"default\": null
    },
    \"is_required\": false,
    \"is_searchable\": true,
    \"display_order\": 1,
    \"status\": \"active\"
  }" > /dev/null

curl -s -X POST "$API/items/custom_field_definitions" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"target_table\": \"students\",
    \"field_name\": \"emergency_contact\",
    \"field_label\": \"Contacto de Emergencia\",
    \"field_type\": \"text\",
    \"field_options\": {},
    \"is_required\": true,
    \"is_searchable\": false,
    \"display_order\": 2,
    \"status\": \"active\"
  }" > /dev/null

echo "Custom field definitions created"

echo ""
echo "========================================="
echo "Seed data created successfully!"
echo "========================================="
echo ""
echo "Demo Organization: Colegio Demo San Martín"
echo "  ID: $ORG_ID"
echo ""
echo "Users created:"
echo "  Admin:    María González (directora@colegiosanmartin.edu.ar)"
echo "  Teacher:  Laura Martínez (laura.martinez@...)"
echo "  Teacher:  Carlos Rodríguez (carlos.rodriguez@...)"
echo "  Parent:   Juan Pérez (juan.perez@gmail.com)"
echo "  Parent:   Ana López (ana.lopez@gmail.com)"
echo ""
echo "Students:"
echo "  Sofía Pérez (1er Grado A)"
echo "  Mateo López (2do Grado A)"
echo ""
echo "Access Directus at: $DIRECTUS_URL"
