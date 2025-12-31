# Kairos - Claude Code Instructions

## Project Overview

Kairos is a school-parent communication app. Multi-tenant architecture with extensible schema (Salesforce-style).

**Stack:**
- Backend/CMS: Directus v11
- Database: PostgreSQL 16
- Hosting: Google Cloud Run + Cloud SQL
- Mobile: React Native with Expo

## Task Management: Beads

Use `bd` (beads) for issue/task tracking across sessions:

```bash
# Finding work
bd ready                              # Show issues ready to work
bd list --status=open                 # All open issues
bd show <id>                          # Detailed issue view

# Creating work
bd create --title="..." --type=task|bug|feature --priority=2
# Priority: 0=critical, 1=high, 2=medium, 3=low, 4=backlog

# Working on issues
bd update <id> --status=in_progress   # Claim work
bd close <id>                         # Mark complete
bd close <id1> <id2> ...              # Close multiple issues

# Dependencies
bd dep add <issue> <depends-on>       # Add dependency
bd blocked                            # Show blocked issues

# Sync (important for ephemeral branches)
bd sync --from-main                   # Pull beads from main
bd stats                              # Project health check
```

**Session Close Protocol:**
```bash
git status                            # Check changes
git add <files>                       # Stage changes
bd sync --from-main                   # Sync beads
git commit -m "..."                   # Commit
```

## Version Control: GitHub

**Repository:** franorzabal-hub/kairos

```bash
# Issues
gh issue list                         # List open issues
gh issue view <n>                     # View issue details
gh issue close <n>                    # Close issue
gh issue comment <n> --body "..."     # Add comment

# PRs
gh pr create --title "..." --body "..."
gh pr list
gh pr merge <n>
```

## Infrastructure: Google Cloud

**Project:** `kairos-escuela-app`
**Region:** `us-central1`

### Directus (Cloud Run)
```bash
# URL
https://kairos-directus-684614817316.us-central1.run.app

# Deploy new version
gcloud run deploy kairos-directus \
  --source ./directus \
  --region us-central1 \
  --allow-unauthenticated

# View logs
gcloud run services logs read kairos-directus --region us-central1
```

### Database (Cloud SQL)
```bash
# Instance: kairos-postgres
gcloud sql connect kairos-postgres --user=postgres

# Backups
gcloud sql backups list --instance=kairos-postgres
```

### Storage (Cloud Storage)
```bash
# Bucket for file uploads
gs://kairos-directus-uploads
```

## MCP Servers

### Context7 - Documentation Lookup

Use for looking up Directus, React Native, Expo, or any library documentation:

```
# First resolve the library ID
mcp__plugin_context7_context7__resolve-library-id
  libraryName: "directus"
  query: "How to create flows programmatically"

# Then query the docs
mcp__plugin_context7_context7__query-docs
  libraryId: "/directus/docs"  # or whatever was resolved
  query: "Creating automated workflows with Flows API"
```

Common lookups:
- Directus v11: flows, permissions, policies, collections, fields
- React Native: navigation, state, hooks
- Expo: push notifications, build, updates
- TanStack Query: mutations, caching, optimistic updates

### Directus Configuration

Directus is the CMS backend. All configuration is automated via scripts.

**Configuration Scripts (run in order):**
```bash
# 1. Get auth token first
curl -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kairos.app","password":"YOUR_PASSWORD"}' \
  | jq -r '.data.access_token' > /tmp/directus_token.txt

# 2. Schema setup (collections, fields)
./scripts/setup-schema.sh
./scripts/setup-relations.sh
./scripts/setup-roles.sh

# 3. UI configuration (icons, colors, groups, templates)
./scripts/configure-directus-ui.sh

# 4. Advanced config (validations, audit fields, O2M relations)
./scripts/configure-directus-phase2.sh

# 5. Flows/Automations (notifications)
./scripts/configure-directus-flows.sh

# 6. Access Policies (multi-tenant permissions)
./scripts/configure-directus-policies.sh

# 7. Seed data (optional, for testing)
./scripts/seed-data.sh
./scripts/seed-conversations.sh
```

**What each script configures:**
| Script | Purpose |
|--------|---------|
| `configure-directus-ui.sh` | Icons, colors, groups, display templates, archive fields |
| `configure-directus-phase2.sh` | Field validations (email, phone, DNI), audit fields, O2M relations |
| `configure-directus-flows.sh` | Notification automations (announcements, messages, pickup) |
| `configure-directus-policies.sh` | Role-based access control (Parent, Teacher, Staff, Admin) |

**Directus Admin UI:**
- Flows: Settings → Flows
- Access Control: Settings → Access Control
- Dashboards: Insights section

**API Authentication:**
```bash
# Get admin token
curl -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kairos.app","password":"admin123"}'

# Save token
echo "TOKEN" > /tmp/directus_token.txt

# Use in API calls
curl -H "Authorization: Bearer $(cat /tmp/directus_token.txt)" \
  "$DIRECTUS_URL/flows"
```

## Project Structure

```
kairos/
├── mobile/                    # React Native app (Expo)
│   ├── src/
│   │   ├── api/              # Directus client, hooks
│   │   ├── screens/          # App screens
│   │   ├── components/       # Reusable UI
│   │   ├── navigation/       # React Navigation
│   │   ├── context/          # App state
│   │   ├── hooks/            # Custom hooks (useSession, etc.)
│   │   └── services/         # Business logic
│   └── app.json
├── directus/                  # Directus config (optional)
├── scripts/                   # Setup and config scripts
├── docs/                      # Documentation
│   ├── DATA_MODEL.md         # Database schema
│   ├── DEPLOYMENT.md         # Deploy guide
│   ├── MOBILE_APP_SPEC.md    # Mobile app specification
│   ├── MOBILE_ARCHITECTURE.md # Mobile app patterns
│   └── DIRECTUS_MANUAL_CONFIG.md  # Manual config guide
└── docker/                    # Local development
```

## Mobile Architecture: Session Management

Use `useSession()` hook for centralized user/children/permissions. See `docs/MOBILE_ARCHITECTURE.md` for full details.

```typescript
// DO THIS - centralized session state
import { useSession } from '../hooks';

function MyScreen() {
  const { user, children, canViewReports, isLoading } = useSession();
  // user.id is guaranteed to be app_user.id (correct for relations)
}

// DON'T DO THIS - scattered state prone to bugs
function MyScreen() {
  const { user } = useAuth();           // user.id might be wrong!
  const { data: children } = useChildren();
  const canViewReports = children.length > 0;  // duplicated logic
}
```

**Key insight**: Directus has TWO user IDs:
- `directus_users.id` - for authentication
- `app_users.id` - for business relations (student_guardians, etc.)

`useSession()` ensures you always use the correct `app_users.id`.

## Key Collections (Directus)

| Collection | Purpose |
|------------|---------|
| organizations | Tenants (schools) |
| app_users | Users (parents, teachers, staff) |
| students | Student records |
| student_guardians | Parent-student relations |
| grades | Grade levels (1st, 2nd, etc.) |
| sections | Class divisions (A, B, C) |
| announcements | School news/updates |
| events | Events with RSVP |
| conversations | WhatsApp-style messaging |
| conversation_messages | Chat messages |
| pickup_requests | Early dismissal requests |
| reports | Report cards/documents |

## Common Tasks

### Adding a new feature
1. `bd create --title="Feature X" --type=feature --priority=2`
2. Update beads: `bd update <id> --status=in_progress`
3. Implement in mobile/src/
4. Test locally with Expo Go
5. Commit and close: `bd close <id>`

### Debugging Directus
1. Check Cloud Run logs: `gcloud run services logs read kairos-directus`
2. Test API: `curl -H "Authorization: Bearer $TOKEN" "$URL/items/collection"`
3. Check permissions in Directus Admin → Access Control

### Mobile Development
```bash
cd mobile
npm install
npx expo start        # Development server
npx expo start --ios  # iOS simulator
npx expo start --android  # Android emulator
```

## Environment Variables

**Directus (Cloud Run):**
- `KEY`, `SECRET` - Security keys
- `DB_*` - PostgreSQL connection
- `STORAGE_*` - GCS configuration
- `PUBLIC_URL` - Directus URL

**Mobile (.env):**
- `EXPO_PUBLIC_DIRECTUS_URL` - API endpoint
- `EXPO_PUBLIC_*` - Other public configs
