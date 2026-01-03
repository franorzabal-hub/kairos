# Kairos - Claude Code Instructions

## Project Overview

Kairos is a school-parent communication app. Multi-tenant architecture with extensible schema (Salesforce-style).

**Stack:**
- Backend/CMS: Frappe Framework v15
- Database: MariaDB (via Frappe)
- Hosting: Google Kubernetes Engine (GKE)
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

### Frappe (GKE)
```bash
# URL
https://kairos.example.com  # Update with actual Frappe URL

# View logs
kubectl logs -l app=frappe -n kairos

# Access Frappe bench
kubectl exec -it <frappe-pod> -n kairos -- bench --help
```

### Database (MariaDB via Frappe)
```bash
# Access via Frappe bench
kubectl exec -it <frappe-pod> -n kairos -- bench mariadb

# Or via Frappe console
kubectl exec -it <frappe-pod> -n kairos -- bench console
```

### Storage (Cloud Storage)
```bash
# Bucket for file uploads
gs://kairos-frappe-uploads
```

## MCP Servers

### Context7 - Documentation Lookup

Use for looking up Frappe Framework, React Native, Expo, or any library documentation:

```
# First resolve the library ID
mcp__plugin_context7_context7__resolve-library-id
  libraryName: "frappe"
  query: "How to create DocTypes programmatically"

# Then query the docs
mcp__plugin_context7_context7__query-docs
  libraryId: "/frappe/frappe"  # or whatever was resolved
  query: "Creating REST API endpoints with Frappe"
```

Common lookups:
- Frappe Framework v15: DocTypes, REST API, permissions, hooks, controllers
- React Native: navigation, state, hooks
- Expo: push notifications, build, updates
- TanStack Query: mutations, caching, optimistic updates

### Frappe API Configuration

Frappe Framework provides the REST API backend. All data is managed via DocTypes.

**Frappe REST API Patterns:**

```bash
# Authentication - Get token
curl -X POST "$FRAPPE_URL/api/method/frappe.auth.get_logged_user" \
  -H "Content-Type: application/json" \
  -d '{"usr":"admin@kairos.app","pwd":"YOUR_PASSWORD"}'

# Or use API key authentication
curl -H "Authorization: token api_key:api_secret" \
  "$FRAPPE_URL/api/resource/DocType"
```

**Common API Operations:**

```bash
# List records (with filters)
curl "$FRAPPE_URL/api/resource/Student?filters=[[\"status\",\"=\",\"Active\"]]"

# Get single record
curl "$FRAPPE_URL/api/resource/Student/STU-2024-00001"

# Create record
curl -X POST "$FRAPPE_URL/api/resource/Message" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test","content":"Hello"}'

# Update record
curl -X PUT "$FRAPPE_URL/api/resource/Message/MSG-2024-00001" \
  -H "Content-Type: application/json" \
  -d '{"status":"Sent"}'

# Delete record
curl -X DELETE "$FRAPPE_URL/api/resource/Message/MSG-2024-00001"

# Call server method
curl -X POST "$FRAPPE_URL/api/method/kairos.api.send_message" \
  -H "Content-Type: application/json" \
  -d '{"message_id":"MSG-2024-00001"}'
```

**Frappe Admin UI:**
- DocTypes: Setup → DocType
- Users & Permissions: Users → User
- Roles: Users → Role
- System Settings: Settings → System Settings

## Project Structure

```
kairos/
├── mobile/                    # React Native app (Expo)
│   ├── src/
│   │   ├── api/              # Frappe API client, hooks
│   │   ├── screens/          # App screens
│   │   ├── components/       # Reusable UI
│   │   ├── navigation/       # React Navigation
│   │   ├── context/          # App state
│   │   ├── hooks/            # Custom hooks (useSession, etc.)
│   │   └── services/         # Business logic
│   └── app.json
├── backend/                   # Frappe app (kairos module)
├── infra/                     # Infrastructure & docs
│   └── docs/
│       └── DATA_MODEL.md     # Canonical data model
├── scripts/                   # Setup and config scripts
├── docs/                      # Documentation
│   ├── DEPLOYMENT.md         # Deploy guide
│   ├── MOBILE_APP_SPEC.md    # Mobile app specification
│   └── MOBILE_ARCHITECTURE.md # Mobile app patterns
└── docker/                    # Local development
```

## Mobile Architecture: Session Management

Use `useSession()` hook for centralized user/children/permissions. See `docs/MOBILE_ARCHITECTURE.md` for full details.

```typescript
// DO THIS - centralized session state
import { useSession } from '../hooks';

function MyScreen() {
  const { user, children, canViewReports, isLoading } = useSession();
  // user.name is the Frappe User ID (email)
}

// DON'T DO THIS - scattered state prone to bugs
function MyScreen() {
  const { user } = useAuth();           // user might be incomplete
  const { data: children } = useChildren();
  const canViewReports = children.length > 0;  // duplicated logic
}
```

**Key insight**: Frappe uses:
- `User` DocType - for authentication (email-based)
- `Guardian` DocType - for parent/guardian business data

`useSession()` ensures you have the correct user context with linked Guardian data.

## Key DocTypes (Frappe)

| DocType | Purpose |
|---------|---------|
| Institution | Tenants (schools) |
| Campus | School campuses/locations |
| Grade | Grade levels (1st, 2nd, etc.) |
| Section | Class divisions (A, B, C) |
| Student | Student records |
| Guardian | Parents/guardians |
| Student Guardian | Parent-student relations |
| Message | Direct communications |
| News | School news/announcements |
| School Event | Events with RSVP |
| Event RSVP | Event responses |

See `/infra/docs/DATA_MODEL.md` for the complete data model.

## Common Tasks

### Adding a new feature
1. `bd create --title="Feature X" --type=feature --priority=2`
2. Update beads: `bd update <id> --status=in_progress`
3. Implement in mobile/src/
4. Test locally with Expo Go
5. Commit and close: `bd close <id>`

### Debugging Frappe API
1. Check GKE logs: `kubectl logs -l app=frappe -n kairos`
2. Test API: `curl -H "Authorization: token $API_KEY:$API_SECRET" "$URL/api/resource/DocType"`
3. Check permissions in Frappe Admin: Users → Role Permissions Manager
4. Use Frappe console: `bench console` for debugging

### Mobile Development
```bash
cd mobile
npm install
npx expo start        # Development server
npx expo start --ios  # iOS simulator
npx expo start --android  # Android emulator
```

## Environment Variables

**Frappe (GKE):**
- `DB_HOST`, `DB_PORT` - MariaDB connection
- `REDIS_CACHE`, `REDIS_QUEUE` - Redis configuration
- `FRAPPE_SITE_NAME` - Site name
- `ADMIN_PASSWORD` - Admin password

**Mobile (.env):**
- `EXPO_PUBLIC_FRAPPE_URL` - API endpoint
- `EXPO_PUBLIC_*` - Other public configs
