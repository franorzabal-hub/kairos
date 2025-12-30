#!/bin/bash

# Seed Conversations for Kairos Mobile App Testing
# This script creates sample conversations between teachers and parents

DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found. Create /tmp/directus_token.txt with admin token"
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "=========================================="
echo "Seeding Conversations..."
echo "=========================================="

# First, get existing users from the database
echo ""
echo "Fetching existing users..."

# Get all app_users with their directus_user_ids
USERS=$(curl -s -X GET "$API/items/app_users?fields=id,first_name,last_name,email,role,directus_user_id,organization_id" \
  -H "$AUTH" \
  -H "Content-Type: application/json")

echo "App Users found:"
echo "$USERS" | jq -r '.data[] | "\(.role): \(.first_name) \(.last_name) (\(.email)) - directus_user_id: \(.directus_user_id)"'

# Extract specific user IDs
ORG_ID=$(echo "$USERS" | jq -r '.data[0].organization_id')
PARENT_1_DIRECTUS=$(echo "$USERS" | jq -r '.data[] | select(.email == "juan.perez@gmail.com") | .directus_user_id')
PARENT_2_DIRECTUS=$(echo "$USERS" | jq -r '.data[] | select(.email == "ana.lopez@gmail.com") | .directus_user_id')
TEACHER_1_DIRECTUS=$(echo "$USERS" | jq -r '.data[] | select(.email == "laura.martinez@colegiosanmartin.edu.ar") | .directus_user_id')
TEACHER_2_DIRECTUS=$(echo "$USERS" | jq -r '.data[] | select(.email == "carlos.rodriguez@colegiosanmartin.edu.ar") | .directus_user_id')
ADMIN_DIRECTUS=$(echo "$USERS" | jq -r '.data[] | select(.email == "directora@colegiosanmartin.edu.ar") | .directus_user_id')

echo ""
echo "User IDs extracted:"
echo "  Organization: $ORG_ID"
echo "  Parent (Juan Pérez): $PARENT_1_DIRECTUS"
echo "  Parent (Ana López): $PARENT_2_DIRECTUS"
echo "  Teacher (Laura Martínez): $TEACHER_1_DIRECTUS"
echo "  Teacher (Carlos Rodríguez): $TEACHER_2_DIRECTUS"
echo "  Admin (María González): $ADMIN_DIRECTUS"

if [ -z "$PARENT_1_DIRECTUS" ] || [ "$PARENT_1_DIRECTUS" = "null" ]; then
  echo ""
  echo "Error: Could not find parent user Juan Pérez with directus_user_id"
  echo "Make sure app_users have their directus_user_id field populated"
  exit 1
fi

# Create Directus users for teachers/admin if they don't exist
echo ""
echo "Creating missing Directus users..."

# Get app_user IDs for linking
TEACHER_1_APP_ID=$(echo "$USERS" | jq -r '.data[] | select(.email == "laura.martinez@colegiosanmartin.edu.ar") | .id')
TEACHER_2_APP_ID=$(echo "$USERS" | jq -r '.data[] | select(.email == "carlos.rodriguez@colegiosanmartin.edu.ar") | .id')
ADMIN_APP_ID=$(echo "$USERS" | jq -r '.data[] | select(.email == "directora@colegiosanmartin.edu.ar") | .id')

# Create directus_user for Teacher 1 (Laura Martínez) if missing
if [ -z "$TEACHER_1_DIRECTUS" ] || [ "$TEACHER_1_DIRECTUS" = "null" ]; then
  echo "  Creating Directus user for Laura Martínez..."
  TEACHER_1_DIRECTUS=$(curl -s -X POST "$API/users" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "laura.martinez@colegiosanmartin.edu.ar",
      "password": "teacher123",
      "first_name": "Laura",
      "last_name": "Martínez",
      "status": "active"
    }' | jq -r '.data.id')

  if [ -n "$TEACHER_1_DIRECTUS" ] && [ "$TEACHER_1_DIRECTUS" != "null" ]; then
    echo "    ✓ Created with ID: $TEACHER_1_DIRECTUS"
    # Link to app_user
    curl -s -X PATCH "$API/items/app_users/$TEACHER_1_APP_ID" \
      -H "$AUTH" \
      -H "Content-Type: application/json" \
      -d "{\"directus_user_id\": \"$TEACHER_1_DIRECTUS\"}" > /dev/null
    echo "    ✓ Linked to app_user"
  else
    echo "    ✗ Failed to create Directus user"
    exit 1
  fi
fi

# Create directus_user for Teacher 2 (Carlos Rodríguez) if missing
if [ -z "$TEACHER_2_DIRECTUS" ] || [ "$TEACHER_2_DIRECTUS" = "null" ]; then
  echo "  Creating Directus user for Carlos Rodríguez..."
  TEACHER_2_DIRECTUS=$(curl -s -X POST "$API/users" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "carlos.rodriguez@colegiosanmartin.edu.ar",
      "password": "teacher123",
      "first_name": "Carlos",
      "last_name": "Rodríguez",
      "status": "active"
    }' | jq -r '.data.id')

  if [ -n "$TEACHER_2_DIRECTUS" ] && [ "$TEACHER_2_DIRECTUS" != "null" ]; then
    echo "    ✓ Created with ID: $TEACHER_2_DIRECTUS"
    curl -s -X PATCH "$API/items/app_users/$TEACHER_2_APP_ID" \
      -H "$AUTH" \
      -H "Content-Type: application/json" \
      -d "{\"directus_user_id\": \"$TEACHER_2_DIRECTUS\"}" > /dev/null
    echo "    ✓ Linked to app_user"
  else
    echo "    ✗ Failed to create Directus user"
    exit 1
  fi
fi

# Create directus_user for Admin (María González) if missing
if [ -z "$ADMIN_DIRECTUS" ] || [ "$ADMIN_DIRECTUS" = "null" ]; then
  echo "  Creating Directus user for María González..."
  ADMIN_DIRECTUS=$(curl -s -X POST "$API/users" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "directora@colegiosanmartin.edu.ar",
      "password": "admin123",
      "first_name": "María",
      "last_name": "González",
      "status": "active"
    }' | jq -r '.data.id')

  if [ -n "$ADMIN_DIRECTUS" ] && [ "$ADMIN_DIRECTUS" != "null" ]; then
    echo "    ✓ Created with ID: $ADMIN_DIRECTUS"
    curl -s -X PATCH "$API/items/app_users/$ADMIN_APP_ID" \
      -H "$AUTH" \
      -H "Content-Type: application/json" \
      -d "{\"directus_user_id\": \"$ADMIN_DIRECTUS\"}" > /dev/null
    echo "    ✓ Linked to app_user"
  else
    echo "    ✗ Failed to create Directus user"
    exit 1
  fi
fi

echo ""
echo "Final User IDs:"
echo "  Teacher 1 (Laura): $TEACHER_1_DIRECTUS"
echo "  Teacher 2 (Carlos): $TEACHER_2_DIRECTUS"
echo "  Admin (María): $ADMIN_DIRECTUS"

echo ""
echo "Creating conversations..."

# Conversation 1: Teacher -> Parent (Welcome message)
echo "Creating Conversation 1: Welcome to the school..."
CONV_1=$(curl -s -X POST "$API/items/conversations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"type\": \"private\",
    \"subject\": \"Bienvenidos a 1er Grado A\",
    \"started_by\": \"$TEACHER_1_DIRECTUS\",
    \"status\": \"open\"
  }" | jq -r '.data.id')
echo "  Conversation ID: $CONV_1"

# Add participants
echo "  Adding participants..."
curl -s -X POST "$API/items/conversation_participants" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_1\",
    \"user_id\": \"$TEACHER_1_DIRECTUS\",
    \"role\": \"teacher\",
    \"can_reply\": true,
    \"is_blocked\": false,
    \"is_muted\": false
  }" > /dev/null

PARTICIPANT_1=$(curl -s -X POST "$API/items/conversation_participants" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_1\",
    \"user_id\": \"$PARENT_1_DIRECTUS\",
    \"role\": \"parent\",
    \"can_reply\": true,
    \"is_blocked\": false,
    \"is_muted\": false
  }" | jq -r '.data.id')

# Add messages
echo "  Adding messages..."
curl -s -X POST "$API/items/conversation_messages" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_1\",
    \"sender_id\": \"$TEACHER_1_DIRECTUS\",
    \"content\": \"Hola Juan, soy Laura Martínez, la maestra de Sofía en 1er Grado A. ¡Bienvenidos al nuevo ciclo lectivo! Cualquier consulta que tengas, no dudes en escribirme.\",
    \"content_type\": \"text\",
    \"is_urgent\": false
  }" > /dev/null

sleep 1

curl -s -X POST "$API/items/conversation_messages" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_1\",
    \"sender_id\": \"$PARENT_1_DIRECTUS\",
    \"content\": \"¡Muchas gracias Laura! Estamos muy contentos con el comienzo del año. Sofía está muy entusiasmada.\",
    \"content_type\": \"text\",
    \"is_urgent\": false
  }" > /dev/null

sleep 1

curl -s -X POST "$API/items/conversation_messages" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_1\",
    \"sender_id\": \"$TEACHER_1_DIRECTUS\",
    \"content\": \"Me alegra mucho saberlo. Sofía es una alumna muy participativa. Recuerden que el viernes tenemos la primera reunión de padres a las 18hs.\",
    \"content_type\": \"text\",
    \"is_urgent\": false
  }" > /dev/null

echo "  ✓ Conversation 1 created with 3 messages"

# Conversation 2: Teacher -> Parent (About homework)
echo ""
echo "Creating Conversation 2: Question about homework..."
CONV_2=$(curl -s -X POST "$API/items/conversations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"type\": \"private\",
    \"subject\": \"Consulta sobre tarea de matemáticas\",
    \"started_by\": \"$PARENT_1_DIRECTUS\",
    \"status\": \"open\"
  }" | jq -r '.data.id')
echo "  Conversation ID: $CONV_2"

echo "  Adding participants..."
curl -s -X POST "$API/items/conversation_participants" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_2\",
    \"user_id\": \"$TEACHER_1_DIRECTUS\",
    \"role\": \"teacher\",
    \"can_reply\": true,
    \"is_blocked\": false,
    \"is_muted\": false
  }" > /dev/null

curl -s -X POST "$API/items/conversation_participants" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_2\",
    \"user_id\": \"$PARENT_1_DIRECTUS\",
    \"role\": \"parent\",
    \"can_reply\": true,
    \"is_blocked\": false,
    \"is_muted\": false
  }" > /dev/null

echo "  Adding messages..."
curl -s -X POST "$API/items/conversation_messages" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_2\",
    \"sender_id\": \"$PARENT_1_DIRECTUS\",
    \"content\": \"Hola Laura, tengo una duda sobre la tarea de matemáticas de hoy. ¿Hay que entregar los ejercicios del 1 al 10 o solo los impares?\",
    \"content_type\": \"text\",
    \"is_urgent\": false
  }" > /dev/null

sleep 1

curl -s -X POST "$API/items/conversation_messages" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_2\",
    \"sender_id\": \"$TEACHER_1_DIRECTUS\",
    \"content\": \"¡Hola Juan! Son todos los ejercicios del 1 al 10. Los impares son obligatorios y los pares son optativos para práctica extra. Pero si pueden hacer todos, mejor 😊\",
    \"content_type\": \"text\",
    \"is_urgent\": false
  }" > /dev/null

echo "  ✓ Conversation 2 created with 2 messages"

# Conversation 3: From Admin (closed conversation)
echo ""
echo "Creating Conversation 3: Admin notification (closed)..."
CONV_3=$(curl -s -X POST "$API/items/conversations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"type\": \"private\",
    \"subject\": \"Documentación pendiente\",
    \"started_by\": \"$ADMIN_DIRECTUS\",
    \"status\": \"closed\",
    \"closed_by\": \"$ADMIN_DIRECTUS\",
    \"closed_at\": \"2025-01-15T10:00:00Z\",
    \"closed_reason\": \"Documentación recibida\"
  }" | jq -r '.data.id')
echo "  Conversation ID: $CONV_3"

echo "  Adding participants..."
curl -s -X POST "$API/items/conversation_participants" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_3\",
    \"user_id\": \"$ADMIN_DIRECTUS\",
    \"role\": \"admin\",
    \"can_reply\": true,
    \"is_blocked\": false,
    \"is_muted\": false
  }" > /dev/null

curl -s -X POST "$API/items/conversation_participants" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_3\",
    \"user_id\": \"$PARENT_1_DIRECTUS\",
    \"role\": \"parent\",
    \"can_reply\": false,
    \"is_blocked\": false,
    \"is_muted\": false
  }" > /dev/null

echo "  Adding messages..."
curl -s -X POST "$API/items/conversation_messages" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_3\",
    \"sender_id\": \"$ADMIN_DIRECTUS\",
    \"content\": \"Estimado Juan, le recordamos que aún falta entregar el certificado de vacunación actualizado de Sofía. Por favor acérquese a secretaría.\",
    \"content_type\": \"text\",
    \"is_urgent\": true
  }" > /dev/null

sleep 1

curl -s -X POST "$API/items/conversation_messages" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_3\",
    \"sender_id\": \"$PARENT_1_DIRECTUS\",
    \"content\": \"Buenas tardes, hoy paso por secretaría a dejar el certificado. Disculpen la demora.\",
    \"content_type\": \"text\",
    \"is_urgent\": false
  }" > /dev/null

sleep 1

curl -s -X POST "$API/items/conversation_messages" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_3\",
    \"sender_id\": \"$ADMIN_DIRECTUS\",
    \"content\": \"Perfecto, muchas gracias. Quedamos a la espera.\",
    \"content_type\": \"text\",
    \"is_urgent\": false
  }" > /dev/null

echo "  ✓ Conversation 3 created with 3 messages (closed)"

# Conversation 4: Urgent message from teacher
echo ""
echo "Creating Conversation 4: Urgent message..."
CONV_4=$(curl -s -X POST "$API/items/conversations" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"organization_id\": \"$ORG_ID\",
    \"type\": \"private\",
    \"subject\": \"[URGENTE] Cambio de horario mañana\",
    \"started_by\": \"$TEACHER_1_DIRECTUS\",
    \"status\": \"open\"
  }" | jq -r '.data.id')
echo "  Conversation ID: $CONV_4"

echo "  Adding participants..."
curl -s -X POST "$API/items/conversation_participants" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_4\",
    \"user_id\": \"$TEACHER_1_DIRECTUS\",
    \"role\": \"teacher\",
    \"can_reply\": true,
    \"is_blocked\": false,
    \"is_muted\": false
  }" > /dev/null

curl -s -X POST "$API/items/conversation_participants" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_4\",
    \"user_id\": \"$PARENT_1_DIRECTUS\",
    \"role\": \"parent\",
    \"can_reply\": true,
    \"is_blocked\": false,
    \"is_muted\": false
  }" > /dev/null

echo "  Adding messages..."
curl -s -X POST "$API/items/conversation_messages" \
  -H "$AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"conversation_id\": \"$CONV_4\",
    \"sender_id\": \"$TEACHER_1_DIRECTUS\",
    \"content\": \"Hola Juan, te aviso que mañana el ingreso es a las 9:00 en lugar de 8:00 por una actividad especial de dirección. ¡No olviden!\",
    \"content_type\": \"text\",
    \"is_urgent\": true
  }" > /dev/null

echo "  ✓ Conversation 4 created with 1 urgent message"

echo ""
echo "=========================================="
echo "Conversations seeded successfully!"
echo "=========================================="
echo ""
echo "Created 4 conversations for user Juan Pérez:"
echo "  1. 'Bienvenidos a 1er Grado A' - 3 messages (open)"
echo "  2. 'Consulta sobre tarea de matemáticas' - 2 messages (open)"
echo "  3. 'Documentación pendiente' - 3 messages (closed)"
echo "  4. '[URGENTE] Cambio de horario mañana' - 1 message (open)"
echo ""
echo "Refresh the app to see the conversations!"
echo ""
