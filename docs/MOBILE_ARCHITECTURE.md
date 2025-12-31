# Mobile App Architecture

## Overview

The Kairos mobile app is built with React Native + Expo, using a centralized state management approach to avoid scattered user/permission logic.

## Session Management Pattern

### The Problem

Previously, each screen had to manage user state independently:

```typescript
// OLD PATTERN - Don't do this
function SomeScreen() {
  const { user } = useAuth();
  const { data: children } = useChildren();
  const canViewReports = children.length > 0;

  // Bug risk: user.id might be wrong (Directus ID vs app_user ID)
  // Bug risk: children might not be loaded yet
  // Bug risk: permission logic duplicated across screens
}
```

This led to bugs where:
- The wrong `user.id` was used (Directus ID vs app_user ID)
- Children weren't loaded when needed
- Permission logic was duplicated and inconsistent

### The Solution: `useSession` Hook

A centralized session hook that provides user, children, and derived permissions:

```typescript
// NEW PATTERN - Use this
import { useSession } from '../hooks';

function SomeScreen() {
  const {
    user,
    children,
    canViewReports,
    isLoading,
    getChildById
  } = useSession();

  if (isLoading) return <Loading />;
  // user.id is guaranteed to be app_user.id (correct for relations)
  // children are loaded automatically
  // permissions are derived and consistent
}
```

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        useSession()                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  useAuth()  │  │ useChildren()│  │    useFilters()     │ │
│  │             │  │              │  │                     │ │
│  │  - user     │  │  - children  │  │  - selectedChildId  │ │
│  │  - isAuth   │  │  - loading   │  │  - setSelectedChild │ │
│  │  - loading  │  │  - error     │  │                     │ │
│  └─────────────┘  └──────────────┘  └─────────────────────┘ │
│           │               │                   │              │
│           └───────────────┼───────────────────┘              │
│                           ▼                                  │
│              ┌────────────────────────┐                      │
│              │   useMemo (derive)     │                      │
│              │                        │                      │
│              │  - hasChildren         │                      │
│              │  - canViewReports      │                      │
│              │  - canRequestPickup    │                      │
│              │  - isPrimaryGuardian   │                      │
│              └────────────────────────┘                      │
│                           │                                  │
│                           ▼                                  │
│              ┌────────────────────────┐                      │
│              │    SessionState        │                      │
│              │                        │                      │
│              │  user, children,       │                      │
│              │  permissions, helpers  │                      │
│              └────────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

### API Reference

```typescript
interface SessionState {
  // Core state
  user: AppUser | null;
  children: Student[];
  isAuthenticated: boolean;

  // Loading states
  isLoading: boolean;          // Combined auth + children loading
  isAuthLoading: boolean;
  isChildrenLoading: boolean;

  // Error states
  childrenError: Error | null;

  // Filter state
  selectedChildId: string | null;
  setSelectedChildId: (id: string | null) => void;

  // Derived permissions
  hasChildren: boolean;
  canViewReports: boolean;
  canRequestPickup: boolean;
  isPrimaryGuardian: boolean;

  // Helper methods
  getChildById: (id: string) => Student | undefined;
  getChildByName: (firstName: string) => Student | undefined;
}
```

### Usage Examples

#### Basic Screen with Children

```typescript
function AgendaScreen() {
  const { children, selectedChildId, setSelectedChildId, getChildById } = useSession();

  const selectedChild = selectedChildId ? getChildById(selectedChildId) : null;

  return (
    <View>
      <ChildSelector
        children={children}
        selectedChildId={selectedChildId}
        onSelectChild={setSelectedChildId}
      />
      {/* ... */}
    </View>
  );
}
```

#### Permission-Gated Content

```typescript
function ReportsScreen() {
  const { canViewReports, isLoading, children } = useSession();

  if (isLoading) return <LoadingSpinner />;

  if (!canViewReports) {
    return <EmptyState message="No tienes hijos registrados" />;
  }

  return <ReportsList children={children} />;
}
```

#### Getting Selected Child

```typescript
import { useSelectedChild } from '../hooks';

function ChildDetailScreen() {
  const child = useSelectedChild();

  if (!child) return <SelectChildPrompt />;

  return <ChildDetail child={child} />;
}
```

## User ID Architecture

### The Two IDs Problem

Directus creates two different user records:

1. **Directus User ID** (`directus_users.id`)
   - Used for authentication
   - Created automatically by Directus
   - Example: `16119d5c-c115-45a0-9946-1f8e8a446c14`

2. **App User ID** (`app_users.id`)
   - Used for business logic and relations
   - Created by our application
   - References `directus_users.id` in `directus_user_id` field
   - Example: `9f05f59b-c3d4-48bc-aa7b-e36296a82650`

### Why This Matters

The `student_guardians` junction table references `app_users.id`:

```sql
student_guardians.user_id → app_users.id  (NOT directus_users.id)
```

If you use the wrong ID, queries return empty results:

```typescript
// WRONG - uses Directus user ID
const guardians = await getGuardians(directusUserId); // Returns []

// CORRECT - uses app_user ID
const guardians = await getGuardians(appUserId); // Returns [{...}, {...}]
```

### How useSession Solves This

The `fetchAppUser` function in `AppContext` automatically fetches the correct `app_users` record after login:

```typescript
// In AppContext.tsx
const login = async (email, password) => {
  await directus.login({ email, password });
  const directusUser = await directus.request(readMe());

  // Fetch the app_user record - this gives us the correct ID
  const appUser = await fetchAppUser(directusUser.email);

  if (appUser) {
    setUser(appUser); // user.id is now app_users.id
  }
};
```

The `useSession` hook exposes this correct `user.id` to all screens.

## File Structure

```
mobile/src/
├── api/
│   ├── directus.ts      # Directus client, types, token management
│   └── hooks.ts         # API hooks (useEvents, useAnnouncements, etc.)
├── context/
│   └── AppContext.tsx   # Core auth context, fetchAppUser logic
├── hooks/
│   ├── index.ts         # Re-exports all hooks
│   ├── useSession.ts    # Centralized session management ← KEY FILE
│   ├── useReadStatus.ts # Read/unread tracking
│   └── ...
├── screens/             # Screen components
└── components/          # Reusable UI components
```

## Best Practices

### DO

- Use `useSession()` for any screen that needs user/children/permissions
- Derive permissions in `useSession` - don't duplicate logic
- Check `isLoading` before rendering permission-dependent content
- Use `getChildById()` instead of `children.find()`

### DON'T

- Don't call `useAuth()` and `useChildren()` separately in screens
- Don't assume `user.id` is the correct ID without using `useSession`
- Don't duplicate permission checks across screens
- Don't access `user.directus_user_id` for business logic queries

## Troubleshooting

### Children not loading?

1. Check `isLoading` - might still be fetching
2. Check `childrenError` - API might have failed
3. Verify `user.id` is an app_user ID (check `fetchAppUser` logs)

### Wrong user ID being used?

1. Check console for `[fetchAppUser]` logs
2. Verify `app_users` permission allows reading for Parent role
3. Ensure `directus_user_id` field exists and is populated in `app_users`

### Permissions not working?

1. Check Directus Access Control → Parent role → policies
2. Verify field-level permissions (e.g., `grade_id` on students)
3. Test API directly with curl to isolate app vs backend issues
