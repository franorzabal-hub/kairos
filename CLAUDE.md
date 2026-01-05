# Frontend Kairos - App para Padres

## Qué es este repo

App mobile y web para **padres/tutores**. Es la misma para todos los colegios (no se customiza por tenant).

**NO confundir con Kairos Desk** (admin para colegios) que está en `backend/frontend/kairos-app/`.

## Stack

- **Framework**: React Native 0.81 + Expo v54
- **Navegación**: Expo Router v6 (file-based)
- **State**: TanStack Query v5 + React Context
- **Styling**: Tailwind CSS / NativeWind
- **Auth**: expo-secure-store, expo-auth-session

## Estructura

```
frontend/
├── mobile/
│   ├── app/                    # Expo Router (páginas)
│   │   ├── (tabs)/            # Tab navigation
│   │   │   ├── index.tsx      # Inicio (dashboard)
│   │   │   ├── novedades/     # Comunicados
│   │   │   ├── agenda/        # Calendario
│   │   │   ├── eventos/       # Eventos
│   │   │   ├── mensajes/      # Chat
│   │   │   ├── mishijos/      # Hijos
│   │   │   └── boletines/     # Reportes
│   │   └── _layout.tsx        # Root layout
│   ├── src/
│   │   ├── api/               # Cliente Frappe + hooks
│   │   ├── components/        # UI reutilizable
│   │   ├── context/           # Auth, Children, UI
│   │   ├── hooks/             # useSession, etc.
│   │   ├── screens/           # Pantallas legacy
│   │   └── services/          # Lógica de negocio
│   └── app.json               # Config Expo
└── docs/                       # Docs específicas mobile
```

## Desarrollo

```bash
cd mobile
npm install
npm run start           # Expo dev server
npm run ios             # iOS simulator
npm run android         # Android emulator
npm run web             # Web browser
```

## Arquitectura de Estado

```typescript
// USAR: Hook centralizado
import { useSession } from '@/hooks/useSession';

function MyScreen() {
  const { user, children, selectedChild, isLoading } = useSession();
}

// NO USAR: Contextos dispersos
const { user } = useAuth();           // Incompleto
const { children } = useChildren();   // Duplica lógica
```

**Contextos:**
- `AuthContext` - Autenticación (user, login, logout)
- `ChildrenContext` - Hijos del usuario
- `UIContext` - Filtros, unread counts

## API Integration

```typescript
// Cliente Frappe
import { frappeClient } from '@/api/frappe';

// Hooks con TanStack Query
import { useAnnouncements } from '@/api/hooks/useAnnouncements';
import { useChildren } from '@/api/hooks/useChildren';
import { useEvents } from '@/api/hooks/useEvents';
```

**Conexión a tenant:**
El tenant se detecta automáticamente. La app se conecta al Frappe del colegio correspondiente.

## Pantallas Principales

| Pantalla | Ruta | Funcionalidad |
|----------|------|---------------|
| Inicio | `/` | Dashboard, shortcuts, próximos eventos |
| Novedades | `/novedades` | Comunicados con pin/archive |
| Agenda | `/agenda` | Calendario de eventos |
| Eventos | `/eventos` | Lista eventos + RSVP |
| Mensajes | `/mensajes` | Chat con staff |
| Mis Hijos | `/mishijos` | Info de hijos |
| Boletines | `/boletines` | Reportes académicos |
| Settings | `/settings` | Perfil, notificaciones |

## Features Implementados

- Login con email/password y Google OAuth
- Biometric auth (Face ID / Touch ID)
- Push notifications (Expo)
- Deep linking
- Offline caching (24h)
- SSL pinning (producción)

## Testing

```bash
npm run test            # Jest
npm run test:watch      # Watch mode
```
