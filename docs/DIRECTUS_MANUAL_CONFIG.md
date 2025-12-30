# Directus Manual Configuration Guide

This document covers configurations that require manual setup through the Directus Admin UI, as they cannot be automated via API scripts.

## Table of Contents
1. [Flows (Automations)](#flows-automations)
2. [Access Policies](#access-policies)
3. [Conditional Fields](#conditional-fields)
4. [Dashboards & Insights](#dashboards--insights)
5. [Presets & Bookmarks](#presets--bookmarks)

---

## Flows (Automations)

Flows in Directus allow you to create automated workflows triggered by events.

### Recommended Flows for Kairos

#### 1. New Announcement Notification
**Purpose**: Send push notification when a new announcement is published

**Configuration**:
- **Trigger**: Event Hook → `items.create` on `announcements`
- **Condition**: `{{$trigger.payload.status}} == "published"`
- **Operations**:
  1. **Read Data**: Get organization users
     - Collection: `app_users`
     - Filter: `organization_id == {{$trigger.payload.organization_id}}`
  2. **Run Script** (or Webhook): Send push notifications
     ```javascript
     // Example operation script
     module.exports = async function(data) {
       const users = data.read_users;
       const announcement = data.$trigger.payload;

       // Call your push notification service
       // e.g., Firebase Cloud Messaging, Expo Push, etc.

       return { notified: users.length };
     }
     ```

#### 2. Event Reminder (24 hours before)
**Purpose**: Remind parents about upcoming events

**Configuration**:
- **Trigger**: Schedule → Cron `0 9 * * *` (daily at 9 AM)
- **Operations**:
  1. **Read Data**: Get events happening tomorrow
     - Collection: `events`
     - Filter: `start_date == {{$now + 1 day}}`
  2. **Loop**: For each event
  3. **Read Data**: Get confirmed attendees
  4. **Webhook/Script**: Send reminder notifications

#### 3. Pickup Request Status Change
**Purpose**: Notify parents when pickup request status changes

**Configuration**:
- **Trigger**: Event Hook → `items.update` on `pickup_requests`
- **Condition**: `{{$trigger.payload.status}} != {{$trigger.previous.status}}`
- **Operations**:
  1. **Read Data**: Get parent info via student
  2. **Send Notification**: Push/Email with new status

#### 4. New Message Notification
**Purpose**: Notify users of new conversation messages

**Configuration**:
- **Trigger**: Event Hook → `items.create` on `conversation_messages`
- **Operations**:
  1. **Read Data**: Get conversation participants (excluding sender)
  2. **Filter**: Exclude muted participants
  3. **Send Notification**: Push notification with message preview

### Creating a Flow

1. Go to **Settings** → **Flows**
2. Click **+ Create Flow**
3. Configure trigger (Event Hook, Schedule, Manual, etc.)
4. Add operations by clicking **+** button
5. Connect operations with success/failure paths
6. Enable the flow with the toggle

---

## Access Policies

Access policies define granular permissions based on conditions. Essential for Kairos multi-tenant architecture.

### Policy: Organization Isolation

All users should only see data from their own organization.

#### Implementation Steps

1. Go to **Settings** → **Access Control**
2. Select or create a Role (e.g., "Parent", "Teacher", "Staff")
3. For each collection, configure:

**Example for `announcements`**:

```
Collection: announcements
Permission: Read
Item Permissions:
  organization_id == $CURRENT_USER.organization_id
```

**Example for `students`** (parents see only their children):

```
Collection: students
Permission: Read
Item Permissions:
  {
    "_and": [
      { "organization_id": { "_eq": "$CURRENT_USER.organization_id" } },
      { "student_guardians": { "user_id": { "_eq": "$CURRENT_USER.id" } } }
    ]
  }
```

### Recommended Roles and Permissions

| Role | Collections | CRUD | Special Conditions |
|------|-------------|------|-------------------|
| **Parent** | announcements, events | R | Own organization only |
| **Parent** | students | R | Own children only (via student_guardians) |
| **Parent** | pickup_requests | CRU | Own children, can create/update pending |
| **Parent** | conversations | R | Own conversations only |
| **Parent** | conversation_messages | CR | Own conversations, can send |
| **Teacher** | announcements | CR | Own organization, teacher_id check |
| **Teacher** | events | CRUD | Own organization |
| **Teacher** | conversations | CRUD | Can create, archive, manage |
| **Teacher** | students | R | Assigned sections only |
| **Admin** | All | CRUD | Own organization |
| **Super Admin** | All | CRUD | No restrictions |

### Creating a Policy

1. **Settings** → **Access Control** → Select Role
2. Click on a collection
3. Set CRUD permissions (Create, Read, Update, Delete)
4. For conditional access, use **Item Permissions**
5. Add filter rules using the visual builder or raw JSON

---

## Conditional Fields

Conditional fields show/hide based on other field values. Useful for context-aware forms.

### Recommended Conditional Fields

#### Announcements - Target Fields

Show `target_grades` only when `target_type` is "grade":

1. Edit `announcements` collection
2. Select `target_grades` field
3. In **Conditions** tab:
   ```json
   {
     "target_type": {
       "_eq": "grade"
     }
   }
   ```

Show `target_sections` only when `target_type` is "section":

1. Select `target_sections` field
2. In **Conditions** tab:
   ```json
   {
     "target_type": {
       "_eq": "section"
     }
   }
   ```

#### Events - Location Fields

Show custom location input when location type is "other":

1. Edit `events` collection
2. If you have a custom location text field, condition it on location type

#### Pickup Requests - Authorized Person Details

Show authorized person fields only when different person is picking up:

```json
{
  "pickup_type": {
    "_eq": "authorized"
  }
}
```

### Setting Up Conditions

1. Go to **Settings** → **Data Model** → Select Collection
2. Click on the field to edit
3. Go to **Conditions** tab
4. Add conditions using the visual rule builder
5. Save changes

---

## Dashboards & Insights

Directus Insights provides analytics dashboards.

### Recommended Dashboards

#### 1. School Overview Dashboard

**Panels**:
- **Metric**: Total active students
- **Metric**: Total announcements this month
- **Metric**: Pending pickup requests
- **Time Series**: Announcements over time
- **List**: Recent events
- **List**: Unread messages count

#### 2. Communication Dashboard

**Panels**:
- **Metric**: Messages sent today
- **Metric**: Open conversations
- **Pie Chart**: Announcement priority distribution
- **Bar Chart**: Events by month
- **List**: Most active conversations

#### 3. Parent Engagement Dashboard

**Panels**:
- **Metric**: Event attendance rate
- **Metric**: Announcement read rate
- **Time Series**: App usage over time
- **List**: Parents with unread announcements

### Creating a Dashboard

1. Go to **Insights** in the sidebar
2. Click **+ Create Dashboard**
3. Name your dashboard
4. Add panels using the **+** button
5. Configure each panel:
   - Choose visualization type
   - Select collection and fields
   - Add filters and grouping
   - Set refresh interval

---

## Presets & Bookmarks

Presets save filter/sort configurations for quick access.

### Recommended Presets

#### For Announcements

1. **Recent Published**: Filter by status=published, sort by -published_at
2. **Urgent Only**: Filter by priority=urgent, status=published
3. **Drafts**: Filter by status=draft

#### For Pickup Requests

1. **Pending Today**: Filter by status=pending, pickup_date=today
2. **Approved This Week**: Filter by status=approved, this week range

#### For Students

1. **Active Only**: Filter by status=active
2. **By Grade**: Group by grade_id

### Creating Presets

**Method 1 - From List View**:
1. Apply desired filters/sort
2. Click bookmark icon in header
3. Name your preset
4. Choose scope (personal/role/global)

**Method 2 - From Settings**:
1. Go to **Settings** → **Presets & Bookmarks**
2. Click **+ Create Preset**
3. Configure collection, filters, layout
4. Assign to user/role/global

---

## Notes

- Always test policies in a staging environment first
- Flows can impact performance - use conditions to limit trigger frequency
- Review access policies regularly as roles evolve
- Document any custom configurations for team reference

## Related Scripts

Run these scripts first to configure the base schema:
- `scripts/configure-directus-ui.sh` - Icons, colors, groups, templates
- `scripts/configure-directus-phase2.sh` - Validations, audit fields, relations

After running scripts, apply the manual configurations above.
