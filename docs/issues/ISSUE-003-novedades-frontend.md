# [Frontend] Novedades - App Móvil

**Parent Issue:** #ISSUE-001 - [Feature] Novedades (Feed / Newsboard)

## Resumen

Implementación del frontend móvil (React Native/Expo) para el módulo de Novedades, incluyendo UI, navegación, y sincronización con el backend.

---

## Estado Actual (Implementado ✅)

### Pantallas

| Pantalla | Archivo | Estado |
|----------|---------|--------|
| Lista de Novedades | `mobile/src/screens/NovedadesScreen.tsx` | ✅ |
| Detalle de Novedad | `mobile/src/screens/NovedadDetailScreen.tsx` | ✅ |

### Componentes

| Componente | Archivo | Funcionalidad |
|------------|---------|---------------|
| `DirectusImage` | `mobile/src/components/DirectusImage.tsx` | ✅ Imágenes autenticadas |
| `FilterBar` | `mobile/src/components/FilterBar.tsx` | ✅ Filtro leído/no-leído |
| `ScreenHeader` | `mobile/src/components/ScreenHeader.tsx` | ✅ Header consistente |

### Hooks y Servicios

| Hook/Servicio | Archivo | Funcionalidad |
|---------------|---------|---------------|
| `useAnnouncements()` | `mobile/src/api/hooks.ts:67-92` | ✅ Fetch de novedades |
| `useReadStatus()` | `mobile/src/hooks/useReadStatus.ts` | ✅ Estado lectura local |
| `readStatusService` | `mobile/src/services/readStatusService.ts` | ✅ Persistencia AsyncStorage |

### Funcionalidades UI Implementadas

- ✅ Lista con cards de novedades
- ✅ Pull-to-refresh
- ✅ Filtro "No Leído" / "Todos"
- ✅ Indicadores de prioridad (badges URGENTE/IMPORTANTE)
- ✅ Indicador visual de no-leído (dot rojo, borde izquierdo)
- ✅ Imagen/banner en cards
- ✅ Preview de contenido (HTML stripped)
- ✅ Vista detalle con contenido HTML completo
- ✅ Deep linking básico desde push notifications
- ✅ Badge contador en tab bar

### Interface TypeScript

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
  target_type: 'all' | 'grade' | 'section';
  target_id?: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  published_at?: string;
}
```

---

## Pendiente de Implementar ❌

### 1. Actualizar Interface TypeScript

```typescript
// mobile/src/api/directus.ts

export interface Announcement {
  // ... campos existentes ...

  // Nuevos campos
  pinned: boolean;
  pinned_at?: string;
  pinned_until?: string;
  requires_acknowledgment: boolean;
  acknowledgment_text?: string;
  attachments?: AnnouncementAttachment[];
}

export interface AnnouncementAttachment {
  id: string;
  file_id: string;
  file_type: 'image' | 'video' | 'pdf' | 'document';
  file_url?: string;  // Computed
  file_name?: string;
  sort_order: number;
}

export interface AnnouncementRead {
  id: string;
  announcement_id: string;
  user_id: string;
  read_at: string;
  acknowledged: boolean;
  acknowledged_at?: string;
}
```

### 2. Actualizar `useAnnouncements()` Hook

```typescript
// mobile/src/api/hooks.ts

export function useAnnouncements() {
  const { children, selectedChildId, filterMode } = useAppContext();

  return useQuery({
    queryKey: [...queryKeys.announcements, selectedChildId, filterMode],
    queryFn: async () => {
      // TODO: El backend debe filtrar por targeting
      // Por ahora, enviar context del usuario para filtrado server-side

      const items = await directus.request(
        readItems('announcements', {
          filter: {
            status: { _eq: 'published' },
          },
          // NUEVO: Ordenar pinned primero
          sort: ['-pinned', '-pinned_at', '-published_at'],
          limit: 50,
          // NUEVO: Incluir adjuntos
          fields: ['*', 'attachments.*', 'attachments.file_id.*'],
        })
      );

      return items as Announcement[];
    },
  });
}
```

### 3. Sincronización de Lectura con Servidor

**Nuevo servicio:** `mobile/src/services/readSyncService.ts`

```typescript
// Sincronizar lectura local con servidor

export async function syncReadToServer(
  announcementId: string,
  userId: string
): Promise<void> {
  try {
    await directus.request(
      createItem('announcement_reads', {
        announcement_id: announcementId,
        user_id: userId,
        read_at: new Date().toISOString(),
      })
    );
  } catch (error) {
    // Si ya existe, ignorar (unique constraint)
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }
}

export async function syncAcknowledgment(
  announcementId: string,
  userId: string
): Promise<void> {
  // Buscar el read existente o crear
  const existing = await directus.request(
    readItems('announcement_reads', {
      filter: {
        announcement_id: { _eq: announcementId },
        user_id: { _eq: userId },
      },
    })
  );

  if (existing.length > 0) {
    await directus.request(
      updateItem('announcement_reads', existing[0].id, {
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
    );
  } else {
    await directus.request(
      createItem('announcement_reads', {
        announcement_id: announcementId,
        user_id: userId,
        read_at: new Date().toISOString(),
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
      })
    );
  }
}
```

### 4. UI: Indicador de Novedad Fijada (Pinned)

**Modificar:** `NovedadesScreen.tsx`

```tsx
// En el renderItem de la FlatList

{item.pinned && (
  <View style={styles.pinnedBadge}>
    <Ionicons name="pin" size={12} color="#FFF" />
    <Text style={styles.pinnedText}>FIJADA</Text>
  </View>
)}
```

```typescript
// Estilos adicionales
pinnedBadge: {
  position: 'absolute',
  top: 8,
  left: 8,
  backgroundColor: COLORS.primary,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 4,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  zIndex: 10,
},
pinnedText: {
  color: '#FFF',
  fontSize: 10,
  fontWeight: '700',
},
```

### 5. UI: Botón de Confirmación (Acknowledgment)

**Modificar:** `NovedadDetailScreen.tsx`

```tsx
// Al final del ScrollView, antes de cerrar

{announcement.requires_acknowledgment && !hasAcknowledged && (
  <View style={styles.acknowledgmentContainer}>
    <Text style={styles.acknowledgmentInfo}>
      Esta comunicación requiere tu confirmación de lectura.
    </Text>
    <TouchableOpacity
      style={styles.acknowledgmentButton}
      onPress={handleAcknowledge}
      disabled={isAcknowledging}
    >
      {isAcknowledging ? (
        <ActivityIndicator color="#FFF" />
      ) : (
        <Text style={styles.acknowledgmentButtonText}>
          {announcement.acknowledgment_text || 'He leído y acepto'}
        </Text>
      )}
    </TouchableOpacity>
  </View>
)}

{announcement.requires_acknowledgment && hasAcknowledged && (
  <View style={styles.acknowledgedContainer}>
    <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
    <Text style={styles.acknowledgedText}>
      Confirmado el {formatDate(acknowledgedAt)}
    </Text>
  </View>
)}
```

### 6. UI: Galería de Adjuntos

**Nuevo componente:** `mobile/src/components/AttachmentGallery.tsx`

```tsx
interface AttachmentGalleryProps {
  attachments: AnnouncementAttachment[];
}

export function AttachmentGallery({ attachments }: AttachmentGalleryProps) {
  const images = attachments.filter(a => a.file_type === 'image');
  const pdfs = attachments.filter(a => a.file_type === 'pdf');
  const videos = attachments.filter(a => a.file_type === 'video');
  const documents = attachments.filter(a => a.file_type === 'document');

  return (
    <View style={styles.container}>
      {/* Galería de imágenes con swipe */}
      {images.length > 0 && (
        <ImageGallery images={images} />
      )}

      {/* Lista de PDFs con preview */}
      {pdfs.map(pdf => (
        <PDFPreviewCard key={pdf.id} attachment={pdf} />
      ))}

      {/* Videos embebidos */}
      {videos.map(video => (
        <VideoPlayer key={video.id} attachment={video} />
      ))}

      {/* Otros documentos */}
      {documents.map(doc => (
        <DocumentCard key={doc.id} attachment={doc} />
      ))}
    </View>
  );
}
```

### 7. Componente: Preview de PDF

**Nuevo componente:** `mobile/src/components/PDFPreviewCard.tsx`

```tsx
import { WebView } from 'react-native-webview';
// o usar react-native-pdf para mejor experiencia

interface PDFPreviewCardProps {
  attachment: AnnouncementAttachment;
}

export function PDFPreviewCard({ attachment }: PDFPreviewCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const pdfUrl = useDirectusAsset(attachment.file_id);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setShowPreview(true)}
      >
        <Ionicons name="document-text" size={32} color={COLORS.primary} />
        <View style={styles.info}>
          <Text style={styles.fileName}>{attachment.file_name || 'Documento PDF'}</Text>
          <Text style={styles.hint}>Toca para ver</Text>
        </View>
        <Ionicons name="eye-outline" size={24} color={COLORS.textSecondary} />
      </TouchableOpacity>

      <Modal visible={showPreview} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Ionicons name="close" size={28} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{attachment.file_name}</Text>
            <TouchableOpacity onPress={() => downloadFile(pdfUrl)}>
              <Ionicons name="download-outline" size={28} />
            </TouchableOpacity>
          </View>

          <WebView
            source={{ uri: pdfUrl }}
            style={styles.webview}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}
```

### 8. Filtro por Hijo (Targeting UI)

**Modificar:** `NovedadesScreen.tsx`

El filtro por hijo ya existe en `FilterBar`, pero la query no lo usa:

```typescript
// En useAnnouncements, usar selectedChildId para filtrar

// Opción A: Filtrado client-side (temporal)
const filteredAnnouncements = useMemo(() => {
  if (!selectedChildId || !announcements) return announcements;

  const child = children.find(c => c.id === selectedChildId);
  if (!child) return announcements;

  return announcements.filter(a => {
    if (a.target_type === 'all') return true;
    if (a.target_type === 'grade' && a.target_id === child.grade_id) return true;
    if (a.target_type === 'section' && a.target_id === child.section_id) return true;
    return false;
  });
}, [announcements, selectedChildId, children]);

// Opción B: Filtrado server-side (preferido, requiere backend)
// Enviar selectedChildId como parámetro y que el backend filtre
```

---

## Tareas

### Alta Prioridad

- [ ] Actualizar interface `Announcement` con nuevos campos
- [ ] Implementar sincronización de lectura con servidor
- [ ] Agregar indicador visual de novedad fijada (pinned)
- [ ] Implementar botón de confirmación (acknowledgment)
- [ ] Actualizar ordenamiento: pinned primero

### Media Prioridad

- [ ] Crear componente `AttachmentGallery`
- [ ] Crear componente `PDFPreviewCard` con preview inline
- [ ] Crear componente `ImageGallery` con zoom y swipe
- [ ] Implementar filtrado por hijo (client-side temporal)
- [ ] Crear hook `useAnnouncementRead` para estado de lectura server-side

### Baja Prioridad

- [ ] Agregar soporte para videos embebidos
- [ ] Implementar descarga de adjuntos
- [ ] Crear pantalla de creación/edición (para teachers)
- [ ] Implementar búsqueda de novedades
- [ ] Agregar animaciones de transición

---

## Dependencias a Agregar

```json
{
  "react-native-pdf": "^6.x",           // Preview de PDFs
  "react-native-image-zoom-viewer": "^3.x",  // Galería con zoom
  "react-native-video": "^6.x"          // Reproducción de videos
}
```

---

## Archivos a Modificar/Crear

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `mobile/src/api/directus.ts` | Modificar | Actualizar interfaces |
| `mobile/src/api/hooks.ts` | Modificar | Actualizar useAnnouncements |
| `mobile/src/screens/NovedadesScreen.tsx` | Modificar | Agregar pinned badge, filtrado |
| `mobile/src/screens/NovedadDetailScreen.tsx` | Modificar | Agregar acknowledgment, adjuntos |
| `mobile/src/services/readSyncService.ts` | Crear | Sync con servidor |
| `mobile/src/components/AttachmentGallery.tsx` | Crear | Galería de adjuntos |
| `mobile/src/components/PDFPreviewCard.tsx` | Crear | Preview de PDFs |
| `mobile/src/components/ImageGallery.tsx` | Crear | Galería de imágenes |
| `mobile/src/hooks/useAnnouncementRead.ts` | Crear | Estado lectura server-side |

---

## Wireframes / Diseño

### Card de Novedad (Actualizada)

```
┌────────────────────────────────────┐
│ 📌 FIJADA          🔴 (no leído)   │  ← Badge pinned + dot
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ │         [IMAGEN]               │ │
│ │                                │ │
│ │  🔴 URGENTE                    │ │  ← Badge prioridad
│ └────────────────────────────────┘ │
│  25 dic                            │
│                                    │
│  Título de la novedad              │
│  Preview del contenido...          │
│                                    │
│  📎 3 adjuntos                     │  ← Indicador adjuntos
│                                    │
│  Ver Novedad →                     │
└────────────────────────────────────┘
```

### Vista Detalle (Con Acknowledgment)

```
┌────────────────────────────────────┐
│  ←  Novedad                        │
├────────────────────────────────────┤
│ ┌────────────────────────────────┐ │
│ │                                │ │
│ │         [IMAGEN GRANDE]        │ │
│ │                                │ │
│ └────────────────────────────────┘ │
│                                    │
│  🔴 URGENTE   📌 FIJADA            │
│                                    │
│  Título completo de la novedad     │
│                                    │
│  📅 Martes, 25 de diciembre 2025   │
│  🕐 14:30                          │
│                                    │
│  ─────────────────────────────     │
│                                    │
│  Contenido HTML renderizado...     │
│  Lorem ipsum dolor sit amet...     │
│                                    │
│  ─────────────────────────────     │
│                                    │
│  📎 Adjuntos:                      │
│  ┌──────────────────────────────┐  │
│  │ 📄 Circular_2025.pdf    👁️  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 🖼️ foto1.jpg            👁️  │  │
│  └──────────────────────────────┘  │
│                                    │
│  ─────────────────────────────     │
│                                    │
│  ⚠️ Esta comunicación requiere     │
│  tu confirmación de lectura.       │
│                                    │
│  ┌────────────────────────────┐    │
│  │   HE LEÍDO Y ACEPTO        │    │
│  └────────────────────────────┘    │
│                                    │
└────────────────────────────────────┘
```

---

## Labels

`frontend`, `mobile`, `novedades`, `react-native`
