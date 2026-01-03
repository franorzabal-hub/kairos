# 📋 Feature: Novedades (Announcements) - Documentation

## Labels
`documentation`, `feature`

---

## Functional Definition

### Overview
The Novedades (Announcements) module provides a communication channel for schools to share important news, updates, and announcements with parents. It's the primary information hub within the Kairos app.

### User Stories

#### As a Parent:
- **View Announcements**: I can see a list of all school announcements with visual previews
- **Read Details**: I can tap on any announcement to read the full content with rich HTML formatting
- **Track Read Status**: I can see which announcements I've read (visual indicators)
- **Filter by Read Status**: I can filter to show only unread announcements
- **Mark as Unread**: I can mark a previously read announcement as unread for future reference
- **Pull to Refresh**: I can refresh the list to get the latest announcements

#### As a School Administrator:
- **Priority Levels**: Announcements can be marked as "urgent", "important", or "normal"
- **Target Audiences**: Announcements can target "all", specific "grades", or "sections"
- **Rich Content**: Announcements support HTML content with images

### Acceptance Criteria

#### List Screen
- [x] Shows announcements sorted by publication date (newest first)
- [x] Displays image preview (or school placeholder if no image)
- [x] Shows priority badges (URGENTE/IMPORTANTE) on relevant items
- [x] Displays unread indicator (blue dot) for unread items
- [x] Unread items have a left border accent
- [x] Filter bar allows switching between "All" and "Unread" views
- [x] Shows unread count badge on filter button
- [x] Pull-to-refresh functionality works correctly
- [x] Empty state shown when no announcements match filters

#### Detail Screen
- [x] Displays full announcement content with HTML rendering
- [x] Shows announcement image or school placeholder
- [x] Displays publication date and time
- [x] Shows target audience badge if not "all"
- [x] Priority badge displayed on image
- [x] "Mark as Unread" button appears in footer
- [x] Marking as unread shows toast and navigates back
- [x] Automatically marks announcement as read on view

### Data Model

```typescript
interface Announcement {
  id: string;
  title: string;
  content: string;           // HTML content
  image: string | null;      // Frappe file URL
  priority: 'normal' | 'important' | 'urgent';
  target_type: 'all' | 'grade' | 'section';
  target_grades?: string[];
  target_sections?: string[];
  published_at: string;
  created_at: string;
  status: 'draft' | 'published' | 'archived';
}
```

---

## Technical Implementation

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Navigation Layer                          │
│  NovedadesStack (Stack Navigator)                           │
│  ├── NovedadesList → NovedadesScreen                        │
│  └── NovedadDetail → NovedadDetailScreen                    │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Screen Components                         │
│  NovedadesScreen.tsx       NovedadDetailScreen.tsx          │
│  - FlatList rendering      - ScrollView with HTML           │
│  - Filter integration      - Read status management         │
│  - Card components         - Mark as unread action          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    State Management                          │
│  React Query (TanStack)    AppContext                       │
│  - useAnnouncements()      - useFilters()                   │
│  - useContentReadStatus()  - useUnreadCounts()              │
│  - Optimistic updates      - Global filter state            │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  frappe.ts                 readStatusService.ts             │
│  - Frappe API client       - content_reads CRUD             │
│  - Type definitions        - Read status persistence        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Frappe)                          │
│  DocTypes:                                                   │
│  - Announcement            - Content Read                   │
│  - File                    - User                           │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── screens/
│   ├── NovedadesScreen.tsx      # List screen
│   └── NovedadDetailScreen.tsx  # Detail screen
├── navigation/
│   └── NovedadesStack.tsx       # Stack navigator
├── api/
│   ├── frappe.ts                # API client & types
│   └── hooks.ts                 # React Query hooks
├── services/
│   └── readStatusService.ts     # Read status persistence
├── components/
│   ├── ScreenHeader.tsx         # Reusable header
│   ├── FilterBar.tsx            # Unread filter component
│   ├── FrappeImage.tsx          # Image loader with fallback
│   └── Toast.tsx                # Toast notifications
├── context/
│   └── AppContext.tsx           # Global state (filters, auth)
└── theme/
    └── index.ts                 # Design tokens
```

### Key Implementation Details

#### 1. Data Fetching (React Query)
```typescript
// hooks.ts
export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const result = await frappe.call({
        method: 'frappe.client.get_list',
        args: {
          doctype: 'Announcement',
          filters: { status: 'published' },
          order_by: 'published_at desc',
          fields: ['*'],
        }
      });
      return result.message as Announcement[];
    },
  });
}
```

#### 2. Read Status Tracking
```typescript
// Uses Content Read DocType in Frappe
// Maps content types: 'Announcement' → 'announcement'
// Optimistic updates for instant UI feedback
// Shared cache via React Query for cross-screen sync
```

#### 3. Infinite Loop Prevention
```typescript
// NovedadDetailScreen.tsx
const hasMarkedReadRef = useRef<string | null>(null);

useEffect(() => {
  if (hasMarkedReadRef.current !== announcement.id) {
    hasMarkedReadRef.current = announcement.id;
    markAsRead(announcement.id);
  }
}, [announcement.id, markAsRead]);
```

#### 4. Filtering Logic
```typescript
const filteredAnnouncements = useMemo(() => {
  let result = announcements;
  if (filterMode === 'unread') {
    result = filterUnread(result);
  }
  return result;
}, [announcements, filterMode, filterUnread]);
```

### Design System Integration

- **Colors**: Uses COLORS.primary (#8B1538), COLORS.warning for badges
- **Typography**: TYPOGRAPHY.cardTitle, TYPOGRAPHY.body from theme
- **Spacing**: SPACING.md, SPACING.screenPadding for consistent layout
- **Shadows**: SHADOWS.card for elevation
- **Unread Styles**: UNREAD_STYLES.dot, UNREAD_STYLES.borderLeft

### Dependencies

- `@tanstack/react-query` - Data fetching & caching
- `frappe-js-sdk` or custom Frappe API client - Backend communication
- `react-native-render-html` - HTML content rendering
- `@react-navigation/native-stack` - Screen navigation
- `@expo/vector-icons` - Ionicons, MaterialCommunityIcons

---

## Related Issues
- See: ISSUE_novedades_improvements.md - Improvement proposals (best practices analysis)
