# [Backend] Novedades - API y Modelo de Datos

**Parent Issue:** #ISSUE-001 - [Feature] Novedades (Feed / Newsboard)

## Resumen

Implementación del backend para el módulo de Novedades, incluyendo modelo de datos, API REST, webhooks y lógica de negocio.

---

## Estado Actual (Implementado ✅)

### Modelo de Datos - Colección `announcements`

**Archivo:** `scripts/setup-schema.sh:139-154`

| Campo | Tipo | Estado |
|-------|------|--------|
| `id` | UUID (PK) | ✅ |
| `organization_id` | UUID (FK) | ✅ |
| `author_id` | UUID (FK) | ✅ |
| `title` | String | ✅ |
| `content` | Text/HTML | ✅ |
| `image` | UUID (File) | ✅ (solo 1 imagen) |
| `priority` | Enum (normal/important/urgent) | ✅ |
| `target_type` | Enum (all/grade/section) | ✅ |
| `target_id` | UUID | ✅ |
| `status` | Enum (draft/published/archived) | ✅ |
| `publish_at` | Timestamp | ✅ |
| `expires_at` | Timestamp | ✅ |
| `custom_fields` | JSON | ✅ |
| `created_at` | Timestamp | ✅ |
| `published_at` | Timestamp | ✅ |

### Relaciones Configuradas

**Archivo:** `scripts/setup-relations.sh`

- ✅ `organization_id` → `organizations.id`
- ✅ `author_id` → `app_users.id`
- ✅ `image` → `directus_files.id`

### Permisos por Rol

**Archivo:** `scripts/setup-roles.sh`

- ✅ **Parents**: Lectura de publicadas
- ✅ **Teachers**: CRUD completo
- ✅ **Admins**: CRUD completo

### Storage de Archivos

- ✅ Google Cloud Storage configurado para imágenes
- ✅ URLs autenticadas con token

---

## Pendiente de Implementar ❌

### 1. Modelo de Datos - Nuevos Campos

```sql
-- Campos a agregar a la colección announcements

-- Pinning
pinned BOOLEAN DEFAULT false,
pinned_at TIMESTAMP,
pinned_until TIMESTAMP,

-- Acknowledgment
requires_acknowledgment BOOLEAN DEFAULT false,
acknowledgment_text VARCHAR(500),  -- Texto personalizado del botón

-- Targeting avanzado
target_users JSON,  -- Array de user_ids para targeting específico
```

### 2. Nueva Colección: `announcement_attachments`

Para soporte de múltiples adjuntos:

```sql
CREATE TABLE announcement_attachments (
  id UUID PRIMARY KEY,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  file_id UUID REFERENCES directus_files(id),
  file_type VARCHAR(50),  -- 'image', 'video', 'pdf', 'document'
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 3. Nueva Colección: `announcement_reads`

Para tracking de lecturas en servidor:

```sql
CREATE TABLE announcement_reads (
  id UUID PRIMARY KEY,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES app_users(id),
  read_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,

  UNIQUE(announcement_id, user_id)
);
```

### 4. Nueva Colección: `announcement_targets`

Para segmentación múltiple:

```sql
CREATE TABLE announcement_targets (
  id UUID PRIMARY KEY,
  announcement_id UUID REFERENCES announcements(id) ON DELETE CASCADE,
  target_type VARCHAR(50),  -- 'all', 'level', 'grade', 'section', 'user'
  target_id UUID,  -- ID del nivel/grado/sección/usuario
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. API Endpoints Adicionales

#### Reads & Acknowledgments

```
POST   /items/announcement_reads
       Body: { announcement_id, user_id }
       → Registra lectura

PATCH  /items/announcement_reads/:id
       Body: { acknowledged: true }
       → Marca como confirmado

GET    /items/announcement_reads?filter[announcement_id][_eq]=:id
       → Lista lecturas de una novedad (para métricas)
```

#### Métricas (Custom Endpoint o Flows)

```
GET    /custom/announcements/:id/metrics
       Response: {
         total_recipients: 150,
         read_count: 120,
         read_percentage: 80,
         acknowledged_count: 100,
         acknowledged_percentage: 66.7,
         pending_users: [{ id, name, email }, ...]
       }
```

### 6. Webhooks / Flows

#### On Publish → Send Push Notification

```javascript
// Directus Flow: Trigger on announcements.items.update
// Condition: status changed to 'published'

// Action: Send to appropriate audience via FCM/Expo
{
  trigger: 'items.update',
  collection: 'announcements',
  condition: '$trigger.payload.status === "published"',
  actions: [
    {
      type: 'webhook',
      url: '/api/notifications/send-announcement',
      body: {
        announcement_id: '$trigger.key',
        target_type: '$trigger.payload.target_type',
        target_id: '$trigger.payload.target_id'
      }
    }
  ]
}
```

#### Auto-Unpin Expired

```javascript
// Directus Flow: Scheduled (cron every hour)
// Action: Set pinned=false where pinned_until < NOW()

UPDATE announcements
SET pinned = false, pinned_at = null
WHERE pinned = true AND pinned_until < NOW();
```

### 7. Lógica de Query para Targeting

El endpoint de lectura debe filtrar según la audiencia del usuario:

```javascript
// Pseudocódigo para filtrar novedades por audiencia

async function getAnnouncementsForUser(userId) {
  const user = await getUser(userId);
  const children = await getChildrenOf(userId);

  // Obtener grados y secciones de los hijos
  const grades = children.map(c => c.grade_id);
  const sections = children.map(c => c.section_id);
  const levels = [...new Set(children.map(c => c.level_id))];

  return db.query(`
    SELECT a.* FROM announcements a
    LEFT JOIN announcement_targets t ON a.id = t.announcement_id
    WHERE a.status = 'published'
    AND a.organization_id = $1
    AND (
      -- Broadcast a todos
      t.target_type = 'all'
      -- O targeting por nivel
      OR (t.target_type = 'level' AND t.target_id = ANY($2))
      -- O targeting por grado
      OR (t.target_type = 'grade' AND t.target_id = ANY($3))
      -- O targeting por sección
      OR (t.target_type = 'section' AND t.target_id = ANY($4))
      -- O targeting específico a este usuario
      OR (t.target_type = 'user' AND t.target_id = $5)
    )
    ORDER BY a.pinned DESC, a.pinned_at DESC NULLS LAST, a.published_at DESC
  `, [user.organization_id, levels, grades, sections, userId]);
}
```

---

## Tareas

### Alta Prioridad

- [ ] Agregar campos `pinned`, `pinned_at`, `pinned_until` a `announcements`
- [ ] Agregar campos `requires_acknowledgment`, `acknowledgment_text`
- [ ] Crear colección `announcement_reads` con relaciones
- [ ] Crear colección `announcement_attachments` con relaciones
- [ ] Implementar query de targeting en lectura de novedades

### Media Prioridad

- [ ] Crear colección `announcement_targets` para multi-targeting
- [ ] Agregar campo `target_users` JSON para targeting específico
- [ ] Crear Flow para auto-unpin novedades expiradas
- [ ] Implementar endpoint de métricas de lectura

### Baja Prioridad

- [ ] Crear endpoint para enviar recordatorios a no-lectores
- [ ] Implementar soft-delete con auditoría
- [ ] Agregar soporte para templates de novedades recurrentes

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `scripts/setup-schema.sh` | Agregar nuevos campos y colecciones |
| `scripts/setup-relations.sh` | Agregar relaciones para nuevas colecciones |
| `scripts/setup-roles.sh` | Permisos para `announcement_reads`, `announcement_attachments` |
| `scripts/seed-data.sh` | Datos de prueba actualizados |

---

## Estimación de Esfuerzo

| Tarea | Complejidad |
|-------|-------------|
| Nuevos campos en announcements | Baja |
| Colección announcement_reads | Media |
| Colección announcement_attachments | Media |
| Colección announcement_targets | Media |
| Query de targeting | Alta |
| Endpoint de métricas | Media |
| Flows/Webhooks | Media |

---

## Labels

`backend`, `novedades`, `database`, `api`
