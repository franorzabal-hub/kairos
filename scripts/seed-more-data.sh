#!/bin/bash
set -e

DIRECTUS_URL="https://kairos-directus-684614817316.us-central1.run.app"

# Get auth token
echo "Getting auth token..."
TOKEN=$(curl -s -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kairos.app","password":"admin123"}' | jq -r '.data.access_token')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "Failed to get token"
  exit 1
fi
echo "Token obtained"

# Get organization ID
echo "Getting organization..."
ORG_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/organizations?limit=1" | jq -r '.data[0].id')
echo "Organization: $ORG_ID"

# Get parent user
echo "Getting parent user..."
PARENT=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/app_users?filter[role][_eq]=parent&limit=1" | jq -r '.data[0]')
PARENT_ID=$(echo $PARENT | jq -r '.id')
echo "Parent ID: $PARENT_ID"

# Get sections
echo "Getting sections..."
SECTIONS=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/sections")
SECTION_1=$(echo $SECTIONS | jq -r '.data[0].id')
SECTION_2=$(echo $SECTIONS | jq -r '.data[1].id // .data[0].id')
SECTION_3=$(echo $SECTIONS | jq -r '.data[2].id // .data[0].id')
echo "Sections: $SECTION_1, $SECTION_2, $SECTION_3"

# Get existing students
echo "Getting existing students..."
EXISTING_STUDENTS=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/students")
STUDENT_COUNT=$(echo $EXISTING_STUDENTS | jq '.data | length')
echo "Existing students: $STUDENT_COUNT"

# Create a third student if we only have 2
if [ "$STUDENT_COUNT" -lt 3 ]; then
  echo "Creating third student..."
  NEW_STUDENT=$(curl -s -X POST "$DIRECTUS_URL/items/students" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"organization_id\": \"$ORG_ID\",
      \"first_name\": \"Valentina\",
      \"last_name\": \"Pérez\",
      \"section_id\": \"$SECTION_3\",
      \"status\": \"active\"
    }")
  NEW_STUDENT_ID=$(echo $NEW_STUDENT | jq -r '.data.id')
  echo "Created student: $NEW_STUDENT_ID"
fi

# Get all students now
echo "Getting all students..."
ALL_STUDENTS=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/students")
echo "Students:"
echo $ALL_STUDENTS | jq '.data[] | {id, first_name, last_name}'

# Get existing guardian relationships
echo "Getting guardian relationships..."
GUARDIANS=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/student_guardians?filter[guardian_id][_eq]=$PARENT_ID")
echo "Existing relationships:"
echo $GUARDIANS | jq '.data'

# Create guardian relationships for all students
echo "Creating guardian relationships..."
for STUDENT_ID in $(echo $ALL_STUDENTS | jq -r '.data[].id'); do
  # Check if relationship exists
  EXISTS=$(curl -s -H "Authorization: Bearer $TOKEN" "$DIRECTUS_URL/items/student_guardians?filter[guardian_id][_eq]=$PARENT_ID&filter[student_id][_eq]=$STUDENT_ID" | jq '.data | length')

  if [ "$EXISTS" = "0" ]; then
    echo "Creating relationship for student $STUDENT_ID..."
    curl -s -X POST "$DIRECTUS_URL/items/student_guardians" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"guardian_id\": \"$PARENT_ID\",
        \"student_id\": \"$STUDENT_ID\",
        \"relationship\": \"parent\",
        \"is_primary\": true,
        \"can_pickup\": true
      }" | jq '.data.id'
  else
    echo "Relationship already exists for student $STUDENT_ID"
  fi
done

# Create future events
echo "Creating future events..."
TODAY=$(date +%Y-%m-%d)
NEXT_WEEK=$(date -v+7d +%Y-%m-%d)
NEXT_MONTH=$(date -v+1m +%Y-%m-%d)

# Event 1: Upcoming event (requires confirmation)
curl -s -X POST "$DIRECTUS_URL/items/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"title\": \"Reunión de Padres - 2do Trimestre\",
    \"description\": \"<p>Los invitamos a la reunión de padres del segundo trimestre donde hablaremos sobre el progreso académico de los alumnos.</p>\",
    \"start_date\": \"${NEXT_WEEK}T18:00:00\",
    \"end_date\": \"${NEXT_WEEK}T20:00:00\",
    \"location\": \"Aula Magna\",
    \"requires_confirmation\": true,
    \"target_type\": \"all\",
    \"status\": \"published\"
  }" | jq '{id: .data.id, title: .data.title}'

# Event 2: Field trip (requires confirmation)
curl -s -X POST "$DIRECTUS_URL/items/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"title\": \"Excursión al Museo de Ciencias\",
    \"description\": \"<p>Salida educativa al Museo de Ciencias Naturales. Los alumnos deberán traer vianda y abrigo.</p>\",
    \"start_date\": \"$(date -v+14d +%Y-%m-%d)T09:00:00\",
    \"end_date\": \"$(date -v+14d +%Y-%m-%d)T16:00:00\",
    \"location\": \"Museo de Ciencias Naturales\",
    \"requires_confirmation\": true,
    \"target_type\": \"all\",
    \"status\": \"published\"
  }" | jq '{id: .data.id, title: .data.title}'

# Event 3: Sports day (no confirmation needed)
curl -s -X POST "$DIRECTUS_URL/items/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"title\": \"Día del Deporte\",
    \"description\": \"<p>Jornada deportiva con actividades para toda la familia. Traer ropa cómoda y protector solar.</p>\",
    \"start_date\": \"$(date -v+21d +%Y-%m-%d)T10:00:00\",
    \"end_date\": \"$(date -v+21d +%Y-%m-%d)T17:00:00\",
    \"location\": \"Campo de deportes\",
    \"requires_confirmation\": false,
    \"target_type\": \"all\",
    \"status\": \"published\"
  }" | jq '{id: .data.id, title: .data.title}'

# Event 4: End of year show
curl -s -X POST "$DIRECTUS_URL/items/events" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"title\": \"Acto de Fin de Año\",
    \"description\": \"<p>Los esperamos al acto de cierre del año escolar con presentaciones artísticas de los alumnos.</p>\",
    \"start_date\": \"${NEXT_MONTH}T17:00:00\",
    \"end_date\": \"${NEXT_MONTH}T20:00:00\",
    \"location\": \"Teatro del colegio\",
    \"requires_confirmation\": false,
    \"target_type\": \"all\",
    \"status\": \"published\"
  }" | jq '{id: .data.id, title: .data.title}'

echo ""
echo "=== Done! ==="
echo "Created/verified 3 children for parent"
echo "Created 4 future events (2 require confirmation)"
