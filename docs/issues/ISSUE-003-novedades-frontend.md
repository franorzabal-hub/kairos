# [Frontend] Novedades - App Móvil

**Parent Issue:** #ISSUE-001 - [Feature] Novedades (Feed / Newsboard)

## Resumen

Implementación del frontend móvil (React Native/Expo) para el módulo de Novedades, incluyendo UI con swipe actions, filtros avanzados, y sincronización con las tablas cross-functional del backend.

---

## Estado Actual (Implementado)

### Pantallas

| Pantalla | Archivo | Estado |
|----------|---------|--------|
| Lista de Novedades | `mobile/src/screens/NovedadesScreen.tsx` | Implementado |
| Detalle de Novedad | `mobile/src/screens/NovedadDetailScreen.tsx` | Implementado |

### Componentes

| Componente | Archivo | Funcionalidad |
|------------|---------|---------------|
| `DirectusImage` | `mobile/src/components/DirectusImage.tsx` | Imágenes autenticadas |
| `FilterBar` | `mobile/src/components/FilterBar.tsx` | Filtro leído/no-leído |
| `ScreenHeader` | `mobile/src/components/ScreenHeader.tsx` | Header consistente |

### Hooks y Servicios

| Hook/Servicio | Archivo | Funcionalidad |
|---------------|---------|---------------|
| `useAnnouncements()` | `mobile/src/api/hooks.ts:67-92` | Fetch de novedades |
| `useReadStatus()` | `mobile/src/hooks/useReadStatus.ts` | Estado lectura local |
| `readStatusService` | `mobile/src/services/readStatusService.ts` | Persistencia AsyncStorage |

### Funcionalidades UI Actuales

- Lista con cards de novedades
- Pull-to-refresh
- Filtro "No Leído" / "Todos"
- Indicadores de prioridad (badges URGENTE/IMPORTANTE)
- Indicador visual de no-leído (dot rojo, borde izquierdo)
- Imagen/banner en cards
- Preview de contenido (HTML stripped)
- Vista detalle con contenido HTML completo
- Deep linking básico desde push notifications
- Badge contador en tab bar

### Interface TypeScript Actual

**Archivo:** `mobile/src/api/directus.ts:39-52`

```typescript
export interface Announcement {
  id: string;
  organization_id: string;
  author_id: string;
  title: string;
  content: string;
  image?: string;
  priority: 'urgent' | 'important' | 'normal';
  target_type: 'all' | 'grade' | 'section';  // Legacy
  target_id?: string;  // Legacy
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at?: string;
}
```

---

## Pendiente de Implementar

### 1. Actualizar Interfaces TypeScript

```typescript
// mobile/src/api/directus.ts

// ========== Interfaces Cross-Functional ==========

export interface ContentTarget {
  id: string;
  content_type: 'announcement' | 'event' | 'message';
  content_id: string;
  target_type: 'all' | 'level' | 'grade' | 'section' | 'user';
  target_id?: string;
  organization_id: string;
}

export interface Attachment {
  id: string;
  content_type: 'announcement' | 'event' | 'message';
  content_id: string;
  file_id: string;
  file_type: 'image' | 'video' | 'pdf' | 'document' | 'audio';
  title?: string;
  description?: string;
  sort_order: number;
  // Computed from file_id relation
  file_url?: string;
  file_name?: string;
  file_size?: number;
}

export interface ContentRead {
  id: string;
  content_type: 'announcement' | 'event' | 'message';
  content_id: string;
  user_id: string;
  read_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
}

export interface ContentUserStatus {
  id: string;
  content_type: 'announcement' | 'event' | 'message';
  content_id: string;
  user_id: string;
  is_archived: boolean;
  archived_at?: string;
  is_pinned: boolean;  // Pin personal del usuario
  pinned_at?: string;
}

// ========== Announcement Actualizado ==========

export interface Announcement {
  id: string;
  organization_id: string;
  author_id: string;
  title: string;
  content: string;
  image?: string;
  priority: 'urgent' | 'important' | 'normal';
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at?: string;

  // Nuevos campos
  pinned: boolean;           // Pin global (del autor/admin)
  pinned_at?: string;
  pinned_until?: string;
  requires_acknowledgment: boolean;
  acknowledgment_text?: string;

  // Relaciones cross-functional
  targets?: ContentTarget[];
  attachments?: Attachment[];

  // Estado del usuario actual (injected)
  user_status?: ContentUserStatus;
  user_read?: ContentRead;
}
```

---

### 2. Swipe Actions en Lista de Novedades

Implementar gestos de deslizamiento para acciones rápidas.

**Dependencia:** `react-native-gesture-handler` + `react-native-reanimated`

**Nuevo componente:** `mobile/src/components/SwipeableCard.tsx`

```tsx
import { Swipeable } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

interface SwipeableCardProps {
  children: React.ReactNode;
  onArchive: () => void;
  onMarkRead: () => void;
  onPin: () => void;
  isRead: boolean;
  isArchived: boolean;
  isPinned: boolean;
}

export function SwipeableCard({
  children,
  onArchive,
  onMarkRead,
  onPin,
  isRead,
  isArchived,
  isPinned,
}: SwipeableCardProps) {

  // ===== Swipe Left → Archivar =====
  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.actionButton, styles.archiveButton]}
      onPress={onArchive}
    >
      <Ionicons
        name={isArchived ? 'arrow-undo' : 'archive'}
        size={24}
        color="#FFF"
      />
      <Text style={styles.actionText}>
        {isArchived ? 'Desarchivar' : 'Archivar'}
      </Text>
    </TouchableOpacity>
  );

  // ===== Swipe Right → Marcar Leído / Pinnear =====
  const renderLeftActions = () => (
    <View style={styles.leftActionsContainer}>
      {/* Marcar como leído/no leído */}
      <TouchableOpacity
        style={[styles.actionButton, styles.readButton]}
        onPress={onMarkRead}
      >
        <Ionicons
          name={isRead ? 'mail-unread' : 'mail-open'}
          size={24}
          color="#FFF"
        />
        <Text style={styles.actionText}>
          {isRead ? 'No leído' : 'Leído'}
        </Text>
      </TouchableOpacity>

      {/* Pinnear */}
      <TouchableOpacity
        style={[styles.actionButton, styles.pinButton]}
        onPress={onPin}
      >
        <Ionicons
          name={isPinned ? 'pin-off' : 'pin'}
          size={24}
          color="#FFF"
        />
        <Text style={styles.actionText}>
          {isPinned ? 'Desfijar' : 'Fijar'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
    >
      {children}
    </Swipeable>
  );
}
```

**Estilos:**
```typescript
const styles = StyleSheet.create({
  leftActionsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    paddingVertical: 12,
  },
  archiveButton: {
    backgroundColor: '#FF9500',  // Naranja
  },
  readButton: {
    backgroundColor: '#007AFF',  // Azul
  },
  pinButton: {
    backgroundColor: '#8B1538',  // Primary
  },
  actionText: {
    color: '#FFF',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});
```

**Uso en NovedadesScreen:**
```tsx
const renderItem = ({ item }: { item: Announcement }) => {
  const isRead = readIds.has(item.id);
  const isArchived = item.user_status?.is_archived ?? false;
  const isPinned = item.user_status?.is_pinned ?? false;

  return (
    <SwipeableCard
      onArchive={() => handleArchive(item.id, !isArchived)}
      onMarkRead={() => handleMarkRead(item.id, !isRead)}
      onPin={() => handlePin(item.id, !isPinned)}
      isRead={isRead}
      isArchived={isArchived}
      isPinned={isPinned}
    >
      <AnnouncementCard item={item} onPress={() => navigateToDetail(item)} />
    </SwipeableCard>
  );
};
```

---

### 3. Filtros Avanzados en FilterBar

Actualizar la barra de filtros con las nuevas opciones.

**Modificar:** `mobile/src/components/FilterBar.tsx`

```tsx
interface FilterBarProps {
  // Filtros de estado de lectura
  readFilter: 'all' | 'unread' | 'read';
  onReadFilterChange: (filter: 'all' | 'unread' | 'read') => void;

  // Filtros adicionales
  showArchived: boolean;
  onShowArchivedChange: (show: boolean) => void;

  showPinnedOnly: boolean;
  onShowPinnedOnlyChange: (show: boolean) => void;

  // Selector de hijo
  selectedChildId: string | null;
  onChildSelect: (childId: string | null) => void;
  children: Child[];
}

export function FilterBar({
  readFilter,
  onReadFilterChange,
  showArchived,
  onShowArchivedChange,
  showPinnedOnly,
  onShowPinnedOnlyChange,
  selectedChildId,
  onChildSelect,
  children,
}: FilterBarProps) {
  return (
    <View style={styles.container}>
      {/* Fila 1: Filtros principales */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {/* No Leídos / Leídos / Todos */}
        <FilterPill
          label="No Leídos"
          active={readFilter === 'unread'}
          onPress={() => onReadFilterChange('unread')}
          count={unreadCount}
        />
        <FilterPill
          label="Leídos"
          active={readFilter === 'read'}
          onPress={() => onReadFilterChange('read')}
        />
        <FilterPill
          label="Todos"
          active={readFilter === 'all'}
          onPress={() => onReadFilterChange('all')}
        />

        <View style={styles.divider} />

        {/* Archivados */}
        <FilterPill
          label="Archivados"
          active={showArchived}
          onPress={() => onShowArchivedChange(!showArchived)}
          icon="archive-outline"
        />

        {/* Solo Fijados */}
        <FilterPill
          label="Fijados"
          active={showPinnedOnly}
          onPress={() => onShowPinnedOnlyChange(!showPinnedOnly)}
          icon="pin-outline"
        />
      </ScrollView>

      {/* Fila 2: Selector de hijo (si hay más de uno) */}
      {children.length > 1 && (
        <ChildSelector
          selectedChildId={selectedChildId}
          onSelect={onChildSelect}
          children={children}
        />
      )}
    </View>
  );
}
```

**Wireframe FilterBar:**
```
┌─────────────────────────────────────────────────────────────────┐
│  [No Leídos (5)]  [Leídos]  [Todos]  │  [📁 Archivados]  [📌 Fijados]  │
├─────────────────────────────────────────────────────────────────┤
│  Mostrando:  [Todos los hijos ▼]                                │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. Servicios para Tablas Cross-Functional

**Nuevo archivo:** `mobile/src/services/contentStatusService.ts`

```typescript
import { directus } from '../api/directus';
import { createItem, updateItem, readItems } from '@directus/sdk';

// ========== Content User Status (Archivar/Pinnear) ==========

export async function toggleArchived(
  contentType: string,
  contentId: string,
  userId: string,
  archived: boolean
): Promise<void> {
  const existing = await findUserStatus(contentType, contentId, userId);

  if (existing) {
    await directus.request(
      updateItem('content_user_status', existing.id, {
        is_archived: archived,
        archived_at: archived ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
    );
  } else {
    await directus.request(
      createItem('content_user_status', {
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        is_archived: archived,
        archived_at: archived ? new Date().toISOString() : null,
      })
    );
  }
}

export async function togglePinned(
  contentType: string,
  contentId: string,
  userId: string,
  pinned: boolean
): Promise<void> {
  const existing = await findUserStatus(contentType, contentId, userId);

  if (existing) {
    await directus.request(
      updateItem('content_user_status', existing.id, {
        is_pinned: pinned,
        pinned_at: pinned ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
    );
  } else {
    await directus.request(
      createItem('content_user_status', {
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        is_pinned: pinned,
        pinned_at: pinned ? new Date().toISOString() : null,
      })
    );
  }
}

async function findUserStatus(contentType: string, contentId: string, userId: string) {
  const results = await directus.request(
    readItems('content_user_status', {
      filter: {
        content_type: { _eq: contentType },
        content_id: { _eq: contentId },
        user_id: { _eq: userId },
      },
      limit: 1,
    })
  );
  return results[0] || null;
}

// ========== Content Reads (Lectura/Acknowledgment) ==========

export async function markAsRead(
  contentType: string,
  contentId: string,
  userId: string
): Promise<void> {
  try {
    await directus.request(
      createItem('content_reads', {
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        read_at: new Date().toISOString(),
      })
    );
  } catch (error: any) {
    // Ignorar error de unique constraint (ya está marcado)
    if (!error.message?.includes('unique')) {
      throw error;
    }
  }
}

export async function markAsUnread(
  contentType: string,
  contentId: string,
  userId: string
): Promise<void> {
  const existing = await directus.request(
    readItems('content_reads', {
      filter: {
        content_type: { _eq: contentType },
        content_id: { _eq: contentId },
        user_id: { _eq: userId },
      },
      limit: 1,
    })
  );

  if (existing[0]) {
    await directus.request(
      deleteItem('content_reads', existing[0].id)
    );
  }
}

export async function acknowledge(
  contentType: string,
  contentId: string,
  userId: string
): Promise<void> {
  const existing = await directus.request(
    readItems('content_reads', {
      filter: {
        content_type: { _eq: contentType },
        content_id: { _eq: contentId },
        user_id: { _eq: userId },
      },
      limit: 1,
    })
  );

  if (existing[0]) {
    await directus.request(
      updateItem('content_reads', existing[0].id, {
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
    );
  } else {
    await directus.request(
      createItem('content_reads', {
        content_type: contentType,
        content_id: contentId,
        user_id: userId,
        read_at: new Date().toISOString(),
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
    );
  }
}
```

---

### 5. Hook Actualizado: `useAnnouncements()`

```typescript
// mobile/src/api/hooks.ts

interface UseAnnouncementsOptions {
  readFilter: 'all' | 'unread' | 'read';
  showArchived: boolean;
  showPinnedOnly: boolean;
  selectedChildId: string | null;
}

export function useAnnouncements(options: UseAnnouncementsOptions) {
  const { user } = useAuth();
  const { children } = useAppContext();

  return useQuery({
    queryKey: [
      'announcements',
      options.readFilter,
      options.showArchived,
      options.showPinnedOnly,
      options.selectedChildId,
    ],
    queryFn: async () => {
      // Obtener targets del usuario (basado en sus hijos)
      const userTargets = getUserTargets(children, options.selectedChildId);

      const items = await directus.request(
        readItems('announcements', {
          filter: {
            status: { _eq: 'published' },
            // El backend debería filtrar por targets, pero por ahora...
          },
          sort: ['-pinned', '-pinned_at', '-published_at'],
          limit: 100,
          fields: [
            '*',
            'attachments.*',
            'attachments.file_id.filename_download',
            'targets.*',
          ],
          // Deep filter para user_status y reads del usuario actual
          deep: {
            user_status: {
              _filter: { user_id: { _eq: user.id } },
            },
            user_read: {
              _filter: { user_id: { _eq: user.id } },
            },
          },
        })
      );

      // Aplicar filtros client-side
      let filtered = items as Announcement[];

      // Filtrar por targeting
      filtered = filterByTargets(filtered, userTargets);

      // Filtrar por estado de lectura
      if (options.readFilter === 'unread') {
        filtered = filtered.filter(a => !a.user_read);
      } else if (options.readFilter === 'read') {
        filtered = filtered.filter(a => !!a.user_read);
      }

      // Filtrar archivados
      if (!options.showArchived) {
        filtered = filtered.filter(a => !a.user_status?.is_archived);
      } else {
        // Mostrar SOLO archivados
        filtered = filtered.filter(a => a.user_status?.is_archived);
      }

      // Filtrar solo pinneados
      if (options.showPinnedOnly) {
        filtered = filtered.filter(a =>
          a.pinned || a.user_status?.is_pinned
        );
      }

      // Ordenar: pinned global > pinned personal > fecha
      filtered.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        if (a.user_status?.is_pinned && !b.user_status?.is_pinned) return -1;
        if (!a.user_status?.is_pinned && b.user_status?.is_pinned) return 1;
        return new Date(b.published_at || b.created_at).getTime() -
               new Date(a.published_at || a.created_at).getTime();
      });

      return filtered;
    },
  });
}

function filterByTargets(items: Announcement[], userTargets: UserTargets) {
  return items.filter(item => {
    if (!item.targets || item.targets.length === 0) return true;

    return item.targets.some(target => {
      if (target.target_type === 'all') return true;
      if (target.target_type === 'level') {
        return userTargets.levels.includes(target.target_id!);
      }
      if (target.target_type === 'grade') {
        return userTargets.grades.includes(target.target_id!);
      }
      if (target.target_type === 'section') {
        return userTargets.sections.includes(target.target_id!);
      }
      if (target.target_type === 'user') {
        return target.target_id === userTargets.userId;
      }
      return false;
    });
  });
}
```

---

### 6. UI: Indicadores Visuales Actualizados

**Card de Novedad con todos los indicadores:**

```tsx
// mobile/src/components/AnnouncementCard.tsx

export function AnnouncementCard({ item, onPress }: Props) {
  const isGlobalPinned = item.pinned;
  const isUserPinned = item.user_status?.is_pinned;
  const isRead = !!item.user_read;
  const isArchived = item.user_status?.is_archived;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        !isRead && styles.unreadCard,
        isArchived && styles.archivedCard,
      ]}
      onPress={onPress}
    >
      {/* Badges superiores */}
      <View style={styles.badgesRow}>
        {isGlobalPinned && (
          <View style={[styles.badge, styles.pinnedBadge]}>
            <Ionicons name="pin" size={10} color="#FFF" />
            <Text style={styles.badgeText}>FIJADA</Text>
          </View>
        )}
        {isUserPinned && !isGlobalPinned && (
          <View style={[styles.badge, styles.userPinnedBadge]}>
            <Ionicons name="pin" size={10} color={COLORS.primary} />
          </View>
        )}
        {item.priority === 'urgent' && (
          <View style={[styles.badge, styles.urgentBadge]}>
            <Text style={styles.badgeText}>URGENTE</Text>
          </View>
        )}
        {item.priority === 'important' && (
          <View style={[styles.badge, styles.importantBadge]}>
            <Text style={styles.badgeText}>IMPORTANTE</Text>
          </View>
        )}
        {!isRead && <View style={styles.unreadDot} />}
      </View>

      {/* Imagen */}
      {item.image && (
        <DirectusImage fileId={item.image} style={styles.image} />
      )}

      {/* Contenido */}
      <View style={styles.content}>
        <Text style={styles.date}>
          {formatDate(item.published_at || item.created_at)}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.preview} numberOfLines={2}>
          {stripHtml(item.content)}
        </Text>

        {/* Indicadores adicionales */}
        <View style={styles.footer}>
          {item.attachments && item.attachments.length > 0 && (
            <View style={styles.attachmentIndicator}>
              <Ionicons name="attach" size={14} color={COLORS.textSecondary} />
              <Text style={styles.attachmentCount}>
                {item.attachments.length}
              </Text>
            </View>
          )}
          {item.requires_acknowledgment && (
            <View style={styles.ackIndicator}>
              <Ionicons
                name={item.user_read?.acknowledged ? 'checkmark-circle' : 'alert-circle'}
                size={14}
                color={item.user_read?.acknowledged ? COLORS.success : COLORS.warning}
              />
            </View>
          )}
          <Text style={styles.cta}>Ver Novedad</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
```

---

### 7. Galería de Adjuntos y Preview PDF

**Componente:** `mobile/src/components/AttachmentGallery.tsx`

```tsx
export function AttachmentGallery({ attachments }: { attachments: Attachment[] }) {
  const images = attachments.filter(a => a.file_type === 'image');
  const pdfs = attachments.filter(a => a.file_type === 'pdf');
  const videos = attachments.filter(a => a.file_type === 'video');
  const documents = attachments.filter(a => a.file_type === 'document');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adjuntos ({attachments.length})</Text>

      {/* Galería de imágenes */}
      {images.length > 0 && (
        <ImageGallery images={images} />
      )}

      {/* PDFs con preview */}
      {pdfs.map(pdf => (
        <PDFCard key={pdf.id} attachment={pdf} />
      ))}

      {/* Videos */}
      {videos.map(video => (
        <VideoCard key={video.id} attachment={video} />
      ))}

      {/* Otros documentos */}
      {documents.map(doc => (
        <DocumentCard key={doc.id} attachment={doc} />
      ))}
    </View>
  );
}
```

**Componente:** `mobile/src/components/PDFCard.tsx`

```tsx
import Pdf from 'react-native-pdf';

export function PDFCard({ attachment }: { attachment: Attachment }) {
  const [showModal, setShowModal] = useState(false);
  const pdfUrl = useDirectusAsset(attachment.file_id);

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={() => setShowModal(true)}>
        <View style={styles.iconContainer}>
          <Ionicons name="document-text" size={28} color={COLORS.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.fileName} numberOfLines={1}>
            {attachment.title || attachment.file_name || 'Documento PDF'}
          </Text>
          <Text style={styles.hint}>Toca para ver</Text>
        </View>
        <Ionicons name="eye-outline" size={20} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={28} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {attachment.title || 'Documento'}
            </Text>
            <TouchableOpacity onPress={() => shareFile(pdfUrl)}>
              <Ionicons name="share-outline" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <Pdf
            source={{ uri: pdfUrl }}
            style={styles.pdf}
            onError={(error) => console.log('PDF Error:', error)}
          />
        </SafeAreaView>
      </Modal>
    </>
  );
}
```

---

## Tareas

### Alta Prioridad

- [ ] Actualizar interfaces TypeScript con tablas cross-functional
- [ ] Implementar componente `SwipeableCard` con gestos
- [ ] Integrar swipe actions: archivar, marcar leído, pinnear
- [ ] Actualizar `FilterBar` con nuevos filtros (archivados, pinneados)
- [ ] Crear servicio `contentStatusService.ts`
- [ ] Sincronizar lectura/archivado/pin con servidor

### Media Prioridad

- [ ] Actualizar `useAnnouncements()` con nuevos filtros
- [ ] Implementar indicadores visuales de pin personal vs global
- [ ] Crear componente `AttachmentGallery`
- [ ] Crear componente `PDFCard` con preview inline
- [ ] Implementar botón de acknowledgment en detalle
- [ ] Agregar animaciones de swipe suaves

### Baja Prioridad

- [ ] Crear componente `ImageGallery` con zoom
- [ ] Agregar soporte para videos embebidos
- [ ] Implementar descarga de adjuntos
- [ ] Crear haptic feedback en swipe actions
- [ ] Agregar undo toast después de archivar

---

## Dependencias a Agregar

```json
{
  "react-native-gesture-handler": "^2.x",
  "react-native-reanimated": "^3.x",
  "react-native-pdf": "^6.x",
  "react-native-image-zoom-viewer": "^3.x"
}
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `mobile/src/api/directus.ts` | Modificar | Interfaces cross-functional |
| `mobile/src/api/hooks.ts` | Modificar | useAnnouncements con filtros |
| `mobile/src/services/contentStatusService.ts` | Crear | Archivar, pinnear, leer |
| `mobile/src/components/SwipeableCard.tsx` | Crear | Wrapper con gestos |
| `mobile/src/components/FilterBar.tsx` | Modificar | Nuevos filtros |
| `mobile/src/components/AnnouncementCard.tsx` | Modificar | Nuevos indicadores |
| `mobile/src/components/AttachmentGallery.tsx` | Crear | Lista de adjuntos |
| `mobile/src/components/PDFCard.tsx` | Crear | Preview de PDF |
| `mobile/src/screens/NovedadesScreen.tsx` | Modificar | Integrar swipe + filtros |
| `mobile/src/screens/NovedadDetailScreen.tsx` | Modificar | Adjuntos + acknowledgment |

---

## Wireframes

### Lista con Swipe Actions

```
                    ← Swipe Left (Archivar)
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  ┌─────────┐  ┌────────────────────────────────────┐  ┌──────────┐  │
│  │ 📬      │  │ 📌 FIJADA        🔴 URGENTE    🔴 │  │ 📁       │  │
│  │ Leído   │  │ ┌────────────────────────────────┐ │  │ Archivar │  │
│  │         │  │ │        [IMAGEN]               │ │  │          │  │
│  │ 📌      │  │ └────────────────────────────────┘ │  │          │  │
│  │ Fijar   │  │ Título de la novedad              │  │          │  │
│  │         │  │ Preview del contenido...          │  │          │  │
│  └─────────┘  └────────────────────────────────────┘  └──────────┘  │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
                    Swipe Right (Leído/Fijar) →
```

### FilterBar Expandida

```
┌─────────────────────────────────────────────────────────────────────┐
│  [No Leídos (5)]  [Leídos]  [Todos]  │  [📁 Archivados]  [📌 Fijados] │
├─────────────────────────────────────────────────────────────────────┤
│  👶 Mostrando:  [Todos los hijos ▼]                                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Card con Indicadores Completos

```
┌────────────────────────────────────────┐
│ 📌 FIJADA   🔴 URGENTE       🔴        │  ← Badges + dot no leído
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │         [IMAGEN/BANNER]            │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
│                                        │
│  25 dic 2025                           │
│                                        │
│  Título de la novedad importante       │
│  Preview del contenido que se          │
│  muestra en dos líneas máximo...       │
│                                        │
│  📎 3   ⚠️                 Ver →       │  ← Adjuntos + requiere ack
└────────────────────────────────────────┘
```

---

## Labels

`frontend`, `mobile`, `novedades`, `react-native`, `swipe-actions`, `cross-functional`
