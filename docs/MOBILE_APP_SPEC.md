# Kairos Mobile App Specification

Based on reference screenshots from St. John's School app (K-01 to K-13).

## Navigation Structure

### Main Drawer Menu
1. **Inicio** (Home) - News feed with announcements
2. **Novedades** - Announcements/News with unread count badge
3. **Eventos** - Calendar view + event list
4. **Mensajes** - Message inbox with unread count
5. **Cambios en salida** - Pickup change requests
6. **Boletines e informes** - Report cards and documents

### Global Header
- Hamburger menu (left)
- Child selector dropdown (center): "Todos mis hijos" / individual child
- Notifications bell with badge (right)
- Calendar icon on Events section

## Screen Specifications

### 1. Home / News Feed (K-01, K-02)
- Card-based layout
- Each card shows:
  - "SIN LEER" badge (unread indicator)
  - School logo/image background
  - Category tag (e.g., "Novedades")
  - Title
  - Subtitle/preview
  - "Ver Novedad" / "Ver Evento" CTA
- Pull-to-refresh

### 2. Child Selector Modal (K-02)
- Header: "¿Qué hijo querés ver?"
- Options:
  - "Todos mis hijos" (with group icon)
  - Individual children with avatar, full name

### 3. Drawer Menu (K-03)
- User profile header (avatar, name) with burgundy background
- Menu items with icons and unread badges
- "Cerrar sesión" at bottom
- Version number

### 4. Announcement Detail (K-04)
- Back navigation with title
- School banner image
- Title
- Rich text content
- Publication date footer

### 5. Events List (K-05)
- Similar card layout to announcements
- Date badge showing day/date
- "Ver Evento" CTA

### 6. Event Detail (K-06)
- Back navigation
- School banner
- Title
- "Cuándo:" date/time field
- Description (if any)

### 7. Calendar View (K-07)
- Month navigation (< Diciembre 2025 >)
- Week day headers (Lu Ma Mi Ju Vi Sa Do)
- Day grid with event indicators
- Empty state: "Aún no contamos con eventos agendados para este mes"

### 8. Messages List (K-08)
- Section header: "Mensajes no leídos"
- Message cards showing:
  - Title (bold)
  - Date/time | Recipients
  - Preview text
  - Read/unread icon
- Floating Action Button for new message

### 9. Message Detail (K-09)
- Back navigation "Mensaje"
- Recipients icon (top right)
- Date separator
- Sender name + time
- Message bubble with content
- Footer: "Conversación cerrada" (for closed threads)

### 10. New Message Form (K-10)
- "Nuevo mensaje" header with send icon
- Form fields:
  - Hijo: dropdown selector
  - "+ Elegir destinatarios" link
  - Asunto: text input
  - Mensaje: multiline textarea

### 11. Pickup Change - New Request (K-11)
- Tab navigation: "Nuevo" | "Historial"
- Form fields:
  - "Este cambio aplica a:" - checkbox list of children
  - Día: date picker
  - Hora: dropdown ("Al finalizar el día", specific times)
  - Motivo: dropdown selector
  - "Se retira con": text input (authorized person)
  - Comentarios: textarea
- "Enviar autorización" primary button

### 12. Pickup Change - History (K-12)
- Tab navigation: "Nuevo" | "Historial"
- List of past requests:
  - Date/time header
  - Child name
  - "Motivo:" reason
  - "Se retira con:" authorized person
  - "Ver" link for details

### 13. Reports / Boletines (K-13)
- Grouped by child (child name as section header)
- Document list items:
  - Document name
  - Download icon (PDF)
- Document types:
  - Boletín (Report card)
  - Inasistencias (Absences)
  - Boletín de convivencia (Behavior report)
  - Rúbricas (Rubrics by trimester)
  - Informe fin de año (Year-end report)

## Design System

### Colors
- **Primary**: Burgundy/Maroon (~#8B1538)
- **Background**: White (#FFFFFF)
- **Text Primary**: Dark gray/black
- **Text Secondary**: Gray (#666)
- **Unread Badge**: Red
- **Info Banner**: Light blue (#E3F2FD)

### Typography
- Headers: Bold, larger size
- Body: Regular weight
- Timestamps: Smaller, gray

### Components
- Cards with subtle shadows
- Rounded buttons
- Floating Action Buttons
- Modal bottom sheets
- Tab navigation
- Checkbox groups
- Dropdown selectors

### Icons (Material Design style)
- menu (hamburger)
- notifications/bell
- calendar
- message/chat
- history/clock
- download
- send
- chevron (navigation)
- checkbox
- radio button
- group/people

## Data Requirements (maps to Directus schema)

| Screen | Collections Used |
|--------|-----------------|
| Home/News | announcements, events |
| Events | events, event_responses |
| Messages | messages, message_reads |
| Pickup Changes | pickup_requests |
| Reports | reports |
| Child Selector | students, student_guardians |
| User Profile | app_users |

## Technical Recommendations

### Framework
- **React Native** with Expo (faster development, OTA updates)
- OR **Flutter** (better performance, single codebase)

### State Management
- React Query / TanStack Query for server state
- Zustand or Context for local state

### Authentication
- Directus Auth SDK
- Secure token storage (expo-secure-store / flutter_secure_storage)
- Biometric login option

### Push Notifications
- Firebase Cloud Messaging (FCM)
- Expo Notifications (if using Expo)

### Offline Support
- Cache announcements/events locally
- Queue pickup requests for sync

## MVP Screens (Phase 1)

1. Login
2. Home (announcements feed)
3. Child selector
4. Announcement detail
5. Events list + detail
6. Pickup request form
7. Pickup history

## Phase 2 Screens

1. Messages list
2. Message detail
3. New message
4. Calendar view
5. Reports/Documents

## Phase 3 Screens

1. Push notification preferences
2. Profile settings
3. Event RSVP
4. Document viewer (PDF)
