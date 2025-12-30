#!/bin/bash

# Configure Directus Flows - Automations for Kairos
# Creates notification flows for announcements, events, messages, etc.

DIRECTUS_URL="${DIRECTUS_URL:-https://kairos-directus-684614817316.us-central1.run.app}"
TOKEN=$(cat /tmp/directus_token.txt 2>/dev/null || echo "")

if [ -z "$TOKEN" ]; then
  echo "Error: No token found. Please authenticate first:"
  echo "  1. Get an admin token from Directus"
  echo "  2. Save it to /tmp/directus_token.txt"
  echo ""
  echo "To get a token:"
  echo "  curl -X POST '$DIRECTUS_URL/auth/login' \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    -d '{\"email\":\"admin@kairos.app\",\"password\":\"YOUR_PASSWORD\"}'"
  exit 1
fi

API="$DIRECTUS_URL"
AUTH="Authorization: Bearer $TOKEN"

echo "============================================"
echo "Configuring Directus Flows (Automations)"
echo "============================================"

# Helper to create a flow
create_flow() {
  local name=$1
  local trigger=$2
  local options=$3
  local status=${4:-active}

  echo "Creating flow: $name"

  local result=$(curl -s -X POST "$API/flows" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"$name\",
      \"trigger\": \"$trigger\",
      \"options\": $options,
      \"status\": \"$status\",
      \"accountability\": \"all\"
    }")

  echo "$result" | jq -r '.data.id // .errors[0].message // "Error"'
}

# Helper to create an operation
create_operation() {
  local flow_id=$1
  local name=$2
  local key=$3
  local type=$4
  local position_x=$5
  local position_y=$6
  local options=$7
  local resolve=${8:-null}
  local reject=${9:-null}

  echo "  Adding operation: $name"

  curl -s -X POST "$API/operations" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{
      \"flow\": \"$flow_id\",
      \"name\": \"$name\",
      \"key\": \"$key\",
      \"type\": \"$type\",
      \"position_x\": $position_x,
      \"position_y\": $position_y,
      \"options\": $options,
      \"resolve\": $resolve,
      \"reject\": $reject
    }" | jq -r '.data.id // .errors[0].message // "Error"'
}

# Helper to update flow with first operation
set_flow_operation() {
  local flow_id=$1
  local operation_id=$2

  curl -s -X PATCH "$API/flows/$flow_id" \
    -H "$AUTH" \
    -H "Content-Type: application/json" \
    -d "{\"operation\": \"$operation_id\"}" > /dev/null
}

echo ""
echo "=== Flow 1: New Announcement Notification ==="

# Create the flow
FLOW1_ID=$(create_flow \
  "Notificar nueva novedad" \
  "event" \
  '{
    "type": "action",
    "scope": ["items.create"],
    "collections": ["announcements"]
  }')

if [[ "$FLOW1_ID" != "Error"* && -n "$FLOW1_ID" ]]; then
  echo "  Flow created: $FLOW1_ID"

  # Operation 1: Condition - Check if published
  OP1_ID=$(create_operation "$FLOW1_ID" \
    "Check if published" \
    "check_published" \
    "condition" \
    19 1 \
    '{
      "filter": {
        "_and": [
          { "status": { "_eq": "published" } }
        ]
      }
    }')

  # Operation 2: Read organization users
  OP2_ID=$(create_operation "$FLOW1_ID" \
    "Get organization users" \
    "get_users" \
    "item-read" \
    37 1 \
    '{
      "collection": "app_users",
      "query": {
        "filter": {
          "organization_id": { "_eq": "{{$trigger.payload.organization_id}}" },
          "status": { "_eq": "active" }
        },
        "fields": ["id", "email", "first_name", "push_token"]
      }
    }')

  # Operation 3: Log/Webhook for push notification
  OP3_ID=$(create_operation "$FLOW1_ID" \
    "Send push notifications" \
    "send_push" \
    "log" \
    55 1 \
    '{
      "message": "Push notification to {{get_users.length}} users for announcement: {{$trigger.payload.title}}"
    }')

  # Link operations
  if [[ -n "$OP1_ID" && "$OP1_ID" != "Error"* ]]; then
    set_flow_operation "$FLOW1_ID" "$OP1_ID"

    # Update OP1 to resolve to OP2
    curl -s -X PATCH "$API/operations/$OP1_ID" \
      -H "$AUTH" \
      -H "Content-Type: application/json" \
      -d "{\"resolve\": \"$OP2_ID\"}" > /dev/null

    # Update OP2 to resolve to OP3
    curl -s -X PATCH "$API/operations/$OP2_ID" \
      -H "$AUTH" \
      -H "Content-Type: application/json" \
      -d "{\"resolve\": \"$OP3_ID\"}" > /dev/null
  fi
fi

echo ""
echo "=== Flow 2: New Message Notification ==="

FLOW2_ID=$(create_flow \
  "Notificar nuevo mensaje" \
  "event" \
  '{
    "type": "action",
    "scope": ["items.create"],
    "collections": ["conversation_messages"]
  }')

if [[ "$FLOW2_ID" != "Error"* && -n "$FLOW2_ID" ]]; then
  echo "  Flow created: $FLOW2_ID"

  # Operation 1: Get conversation participants
  OP1_ID=$(create_operation "$FLOW2_ID" \
    "Get participants" \
    "get_participants" \
    "item-read" \
    19 1 \
    '{
      "collection": "conversation_participants",
      "query": {
        "filter": {
          "conversation_id": { "_eq": "{{$trigger.payload.conversation_id}}" },
          "user_id": { "_neq": "{{$trigger.payload.sender_id}}" },
          "is_muted": { "_eq": false },
          "is_blocked": { "_eq": false }
        },
        "fields": ["user_id.id", "user_id.email", "user_id.first_name", "user_id.push_token"]
      }
    }')

  # Operation 2: Log notification
  OP2_ID=$(create_operation "$FLOW2_ID" \
    "Send message notification" \
    "send_notification" \
    "log" \
    37 1 \
    '{
      "message": "New message notification to {{get_participants.length}} participants"
    }')

  if [[ -n "$OP1_ID" && "$OP1_ID" != "Error"* ]]; then
    set_flow_operation "$FLOW2_ID" "$OP1_ID"
    curl -s -X PATCH "$API/operations/$OP1_ID" \
      -H "$AUTH" \
      -H "Content-Type: application/json" \
      -d "{\"resolve\": \"$OP2_ID\"}" > /dev/null
  fi
fi

echo ""
echo "=== Flow 3: Pickup Request Status Change ==="

FLOW3_ID=$(create_flow \
  "Notificar cambio estado retiro" \
  "event" \
  '{
    "type": "action",
    "scope": ["items.update"],
    "collections": ["pickup_requests"]
  }')

if [[ "$FLOW3_ID" != "Error"* && -n "$FLOW3_ID" ]]; then
  echo "  Flow created: $FLOW3_ID"

  # Operation 1: Check if status changed
  OP1_ID=$(create_operation "$FLOW3_ID" \
    "Check status changed" \
    "check_status" \
    "condition" \
    19 1 \
    '{
      "filter": {
        "_and": [
          { "status": { "_neq": "{{$trigger.payload.status}}" } }
        ]
      }
    }')

  # Operation 2: Get parent info
  OP2_ID=$(create_operation "$FLOW3_ID" \
    "Get parent info" \
    "get_parent" \
    "item-read" \
    37 1 \
    '{
      "collection": "pickup_requests",
      "query": {
        "filter": { "id": { "_eq": "{{$trigger.keys[0]}}" } },
        "fields": ["id", "status", "requested_by.email", "requested_by.first_name", "student_id.first_name"]
      }
    }')

  # Operation 3: Log notification
  OP3_ID=$(create_operation "$FLOW3_ID" \
    "Send status notification" \
    "send_status_notification" \
    "log" \
    55 1 \
    '{
      "message": "Pickup request status changed to {{$trigger.payload.status}} for student {{get_parent[0].student_id.first_name}}"
    }')

  if [[ -n "$OP1_ID" && "$OP1_ID" != "Error"* ]]; then
    set_flow_operation "$FLOW3_ID" "$OP1_ID"
    curl -s -X PATCH "$API/operations/$OP1_ID" \
      -H "$AUTH" \
      -H "Content-Type: application/json" \
      -d "{\"resolve\": \"$OP2_ID\"}" > /dev/null
    curl -s -X PATCH "$API/operations/$OP2_ID" \
      -H "$AUTH" \
      -H "Content-Type: application/json" \
      -d "{\"resolve\": \"$OP3_ID\"}" > /dev/null
  fi
fi

echo ""
echo "=== Flow 4: Event Reminder (Daily Schedule) ==="

FLOW4_ID=$(create_flow \
  "Recordatorio de eventos" \
  "schedule" \
  '{
    "cron": "0 9 * * *"
  }')

if [[ "$FLOW4_ID" != "Error"* && -n "$FLOW4_ID" ]]; then
  echo "  Flow created: $FLOW4_ID"

  # Operation 1: Get tomorrow's events
  OP1_ID=$(create_operation "$FLOW4_ID" \
    "Get tomorrow events" \
    "get_events" \
    "item-read" \
    19 1 \
    '{
      "collection": "events",
      "query": {
        "filter": {
          "start_date": { "_between": ["$NOW", "$NOW(+1 day)"] },
          "status": { "_eq": "published" }
        },
        "fields": ["id", "title", "start_date", "organization_id"]
      }
    }')

  # Operation 2: Log reminders
  OP2_ID=$(create_operation "$FLOW4_ID" \
    "Log event reminders" \
    "log_reminders" \
    "log" \
    37 1 \
    '{
      "message": "Event reminders for {{get_events.length}} events tomorrow"
    }')

  if [[ -n "$OP1_ID" && "$OP1_ID" != "Error"* ]]; then
    set_flow_operation "$FLOW4_ID" "$OP1_ID"
    curl -s -X PATCH "$API/operations/$OP1_ID" \
      -H "$AUTH" \
      -H "Content-Type: application/json" \
      -d "{\"resolve\": \"$OP2_ID\"}" > /dev/null
  fi
fi

echo ""
echo "============================================"
echo "Directus Flows Configuration Complete!"
echo "============================================"
echo ""
echo "Created Flows:"
echo "  1. Notificar nueva novedad (on announcement publish)"
echo "  2. Notificar nuevo mensaje (on new conversation message)"
echo "  3. Notificar cambio estado retiro (on pickup status change)"
echo "  4. Recordatorio de eventos (daily at 9 AM)"
echo ""
echo "NOTE: These flows use 'log' operations as placeholders."
echo "To enable real push notifications, replace 'log' operations with:"
echo "  - 'request-url' operation to call your push notification service"
echo "  - Or create a custom operation extension"
echo ""
echo "Check Directus admin at: $DIRECTUS_URL/admin/settings/flows"
