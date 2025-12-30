# [Backend] Novedades - API, Modelo de Datos y Dashboard

**Parent Issue:** #ISSUE-001 - [Feature] Novedades (Feed / Newsboard)

## Resumen

Implementación del backend para el módulo de Novedades, con arquitectura modular que permite reutilizar **Targeting** y **Attachments** en otros módulos (eventos, mensajes, etc.).

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
| `target_type` | Enum (all/grade/section) | ✅ (legacy, migrar) |
| `target_id` | UUID | ✅ (legacy, migrar) |
| `status` | Enum (draft/published/archived) | ✅ |
| `publish_at` | Timestamp | ✅ |
| `expires_at` | Timestamp | ✅ |
| `custom_fields` | JSON | ✅ |
| `created_at` | Timestamp | ✅ |
| `published_at` | Timestamp | ✅ |

### Relaciones Configuradas

- ✅ `organization_id` → `organizations.id`
- ✅ `author_id` → `app_users.id`
- ✅ `image` → `directus_files.id`

### Permisos por Rol

- ✅ **Parents**: Lectura de publicadas
- ✅ **Teachers**: CRUD completo
- ✅ **Admins**: CRUD completo

### Storage de Archivos

- ✅ Google Cloud Storage configurado
- ✅ URLs autenticadas con token

---

## Arquitectura Propuesta

### Principio: Componentes Reutilizables

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENTES CROSS-FUNCTIONAL                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  content_targets │    │   attachments    │                   │
│  │   (Targeting)    │    │   (Adjuntos)     │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           ▼                       ▼                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ENTIDADES DE CONTENIDO                 │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  announcements  │  events  │  messages  │  boletines     │   │
│  └──────────────────────────────────────────────────────────┘   │
│           │                       │                              │
│           ▼                       ▼                              │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │  content_reads   │    │ content_archived │                   │
│  │   (Lecturas)     │    │  (Archivados)    │                   │
│  └──────────────────┘    └──────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pendiente de Implementar ❌

### 1. Nuevos Campos en `announcements`

```sql
-- Agregar a la colección announcements

-- Pinning
pinned BOOLEAN DEFAULT false,
pinned_at TIMESTAMP,
pinned_until TIMESTAMP,

-- Acknowledgment
requires_acknowledgment BOOLEAN DEFAULT false,
acknowledgment_text VARCHAR(500),  -- Texto personalizado del botón
```

> **Nota:** Eliminar campos legacy `target_type` y `target_id` después de migrar a `content_targets`

---

### 2. Tabla Cross-Functional: `content_targets` (Targeting Genérico)

Sistema de segmentación de audiencia reutilizable para cualquier tipo de contenido.

```sql
CREATE TABLE content_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia polimórfica al contenido
  content_type VARCHAR(50) NOT NULL,  -- 'announcement', 'event', 'message', 'boletin'
  content_id UUID NOT NULL,

  -- Target
  target_type VARCHAR(50) NOT NULL,   -- 'all', 'level', 'grade', 'section', 'user'
  target_id UUID,                      -- NULL si target_type = 'all'

  -- Metadata
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Índices para performance
  UNIQUE(content_type, content_id, target_type, target_id)
);

-- Índices
CREATE INDEX idx_content_targets_content ON content_targets(content_type, content_id);
CREATE INDEX idx_content_targets_target ON content_targets(target_type, target_id);
CREATE INDEX idx_content_targets_org ON content_targets(organization_id);
```

**Uso:**
```sql
-- Novedad para toda la escuela
INSERT INTO content_targets (content_type, content_id, target_type, organization_id)
VALUES ('announcement', '123', 'all', 'org-1');

-- Novedad para 3ro A y 4to B
INSERT INTO content_targets (content_type, content_id, target_type, target_id, organization_id)
VALUES
  ('announcement', '123', 'section', 'section-3a', 'org-1'),
  ('announcement', '123', 'section', 'section-4b', 'org-1');

-- Evento para un usuario específico
INSERT INTO content_targets (content_type, content_id, target_type, target_id, organization_id)
VALUES ('event', '456', 'user', 'user-789', 'org-1');
```

---

### 3. Tabla Cross-Functional: `attachments` (Adjuntos Genéricos)

Sistema de adjuntos reutilizable para cualquier tipo de contenido.

```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia polimórfica al contenido
  content_type VARCHAR(50) NOT NULL,  -- 'announcement', 'event', 'message'
  content_id UUID NOT NULL,

  -- Archivo
  file_id UUID REFERENCES directus_files(id) ON DELETE CASCADE,
  file_type VARCHAR(50) NOT NULL,     -- 'image', 'video', 'pdf', 'document', 'audio'

  -- Metadata
  title VARCHAR(255),                  -- Nombre descriptivo opcional
  description TEXT,                    -- Descripción opcional
  sort_order INTEGER DEFAULT 0,
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),

  -- Índices
  UNIQUE(content_type, content_id, file_id)
);

-- Índices para performance
CREATE INDEX idx_attachments_content ON attachments(content_type, content_id);
CREATE INDEX idx_attachments_org ON attachments(organization_id);
```

**Uso:**
```sql
-- Adjuntar PDF a novedad
INSERT INTO attachments (content_type, content_id, file_id, file_type, title, organization_id)
VALUES ('announcement', '123', 'file-abc', 'pdf', 'Circular Enero 2025', 'org-1');

-- Adjuntar múltiples imágenes a evento
INSERT INTO attachments (content_type, content_id, file_id, file_type, sort_order, organization_id)
VALUES
  ('event', '456', 'img-1', 'image', 0, 'org-1'),
  ('event', '456', 'img-2', 'image', 1, 'org-1'),
  ('event', '456', 'img-3', 'image', 2, 'org-1');
```

---

### 4. Tabla Cross-Functional: `content_reads` (Lecturas/Acknowledgments)

Tracking de lecturas y confirmaciones para cualquier tipo de contenido.

```sql
CREATE TABLE content_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia polimórfica al contenido
  content_type VARCHAR(50) NOT NULL,  -- 'announcement', 'event', 'message'
  content_id UUID NOT NULL,

  -- Usuario
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,

  -- Estado
  read_at TIMESTAMP DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP,

  -- Metadata
  organization_id UUID REFERENCES organizations(id),

  UNIQUE(content_type, content_id, user_id)
);

-- Índices
CREATE INDEX idx_content_reads_content ON content_reads(content_type, content_id);
CREATE INDEX idx_content_reads_user ON content_reads(user_id);
CREATE INDEX idx_content_reads_org ON content_reads(organization_id);
```

---

### 5. Tabla Cross-Functional: `content_user_status` (Archivados/Pinned por Usuario)

Estado personal del usuario sobre contenido (archivado, pinneado, etc.)

```sql
CREATE TABLE content_user_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referencia polimórfica al contenido
  content_type VARCHAR(50) NOT NULL,
  content_id UUID NOT NULL,

  -- Usuario
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,

  -- Estados del usuario
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP,
  is_pinned BOOLEAN DEFAULT false,      -- Pin personal del usuario
  pinned_at TIMESTAMP,

  -- Metadata
  organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(content_type, content_id, user_id)
);

-- Índices
CREATE INDEX idx_content_user_status_content ON content_user_status(content_type, content_id);
CREATE INDEX idx_content_user_status_user ON content_user_status(user_id);
CREATE INDEX idx_content_user_status_archived ON content_user_status(is_archived) WHERE is_archived = true;
CREATE INDEX idx_content_user_status_pinned ON content_user_status(is_pinned) WHERE is_pinned = true;
```

> **Nota:** Distinguir entre:
> - `announcements.pinned` = Pin del autor/admin (todos lo ven arriba)
> - `content_user_status.is_pinned` = Pin personal del usuario

---

### 6. Dashboard Custom en Directus

Página de administración para Teachers/Admins con métricas y gestión de comunicaciones.

#### 6.1 Estructura del Módulo

```
directus/
└── extensions/
    └── modules/
        └── communications-dashboard/
            ├── index.ts           # Registro del módulo
            ├── routes/
            │   ├── index.vue      # Vista principal (lista)
            │   ├── detail.vue     # Vista detalle con métricas
            │   └── create.vue     # Crear nueva comunicación
            └── components/
                ├── MetricsCard.vue
                ├── AudienceSelector.vue   # Componente reutilizable
                ├── ReadStatusTable.vue
                └── FilterBar.vue
```

#### 6.2 Vista Principal - Lista de Comunicaciones

```
┌─────────────────────────────────────────────────────────────────────┐
│  📢 Comunicaciones                                    [+ Nueva]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Filtros:  [No Leídos ▼]  [Archivados ▼]  [Pinned ▼]  [Buscar...] │
│                                                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📌 Protocolo de Seguridad 2025                      📊 95% leído  │
│  Publicado: 15 ene · Audiencia: Toda la escuela · 📎 2 adjuntos    │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  🔴 URGENTE: Cambio de horario mañana                📊 45% leído  │
│  Publicado: hace 2h · Audiencia: 3ro A, 4to B · ⚠️ Requiere confirm│
│                                                                      │
│  ─────────────────────────────────────────────────────────────────  │
│                                                                      │
│  Reunión de padres - Primaria                        📊 78% leído  │
│  Publicado: 10 ene · Audiencia: Nivel Primaria                      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 6.3 Vista Detalle - Métricas de una Comunicación

```
┌─────────────────────────────────────────────────────────────────────┐
│  ← Volver                                     [Editar] [Archivar]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Cambio de horario para mañana                                      │
│  🔴 URGENTE · 📌 Fijada hasta 20 ene                                │
│                                                                      │
├──────────────────────────┬──────────────────────────────────────────┤
│                          │                                          │
│  📊 MÉTRICAS             │  👥 AUDIENCIA                            │
│                          │                                          │
│  Total destinatarios: 45 │  • Sección 3ro A (22 familias)          │
│  ────────────────────    │  • Sección 4to B (23 familias)          │
│  ✅ Leyeron: 32 (71%)    │                                          │
│  ⏳ Pendientes: 13 (29%) │                                          │
│  ✓ Confirmaron: 28 (62%)│                                          │
│                          │                                          │
├──────────────────────────┴──────────────────────────────────────────┤
│                                                                      │
│  📋 ESTADO DE LECTURA                    [Enviar recordatorio]      │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Familia          │ Estado     │ Leído      │ Confirmó          │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ García López     │ ✅ Confirm │ 15 ene 10:30│ 15 ene 10:32     │ │
│  │ Martínez Ruiz    │ ✅ Confirm │ 15 ene 11:00│ 15 ene 11:05     │ │
│  │ Rodríguez Pérez  │ 👁️ Leído  │ 15 ene 14:20│ -                │ │
│  │ Fernández        │ ⏳ Pend.   │ -          │ -                 │ │
│  │ ...              │            │            │                   │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### 6.4 Componente Reutilizable: `AudienceSelector`

Selector de audiencia para usar en creación de novedades, eventos, mensajes, etc.

```vue
<template>
  <div class="audience-selector">
    <h3>Seleccionar Audiencia</h3>

    <!-- Quick options -->
    <div class="quick-options">
      <button @click="selectAll">📢 Toda la escuela</button>
    </div>

    <!-- Hierarchical selector -->
    <div class="hierarchy">
      <div v-for="level in levels" :key="level.id" class="level">
        <label>
          <input type="checkbox" v-model="selectedLevels" :value="level.id">
          {{ level.name }}
        </label>

        <div v-if="isLevelSelected(level.id)" class="grades">
          <div v-for="grade in level.grades" :key="grade.id" class="grade">
            <label>
              <input type="checkbox" v-model="selectedGrades" :value="grade.id">
              {{ grade.name }}
            </label>

            <div v-if="isGradeSelected(grade.id)" class="sections">
              <label v-for="section in grade.sections" :key="section.id">
                <input type="checkbox" v-model="selectedSections" :value="section.id">
                {{ section.name }}
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Specific users -->
    <div class="specific-users">
      <h4>O seleccionar usuarios específicos</h4>
      <UserSearch v-model="selectedUsers" />
    </div>

    <!-- Summary -->
    <div class="summary">
      <strong>Destinatarios:</strong> {{ recipientCount }} familias
    </div>
  </div>
</template>
```

**Props y Eventos:**
```typescript
interface AudienceSelectorProps {
  organizationId: string;
  initialTargets?: ContentTarget[];
}

interface AudienceSelectorEmits {
  (e: 'update:targets', targets: ContentTarget[]): void;
  (e: 'update:recipientCount', count: number): void;
}
```

---

### 7. API Endpoints

#### 7.1 Content Reads

```
POST   /items/content_reads
       Body: { content_type, content_id, user_id }
       → Registra lectura

PATCH  /items/content_reads/:id
       Body: { acknowledged: true }
       → Marca como confirmado
```

#### 7.2 Content User Status (Archivar/Pinnear)

```
POST   /items/content_user_status
       Body: { content_type, content_id, user_id, is_archived: true }
       → Archiva contenido para el usuario

PATCH  /items/content_user_status/:id
       Body: { is_pinned: true }
       → Pinnea contenido para el usuario
```

#### 7.3 Métricas (Custom Endpoint)

```
GET    /custom/communications/:content_type/:content_id/metrics

Response: {
  content_type: 'announcement',
  content_id: '123',

  audience: {
    targets: [
      { type: 'section', id: 'sec-1', name: '3ro A', recipient_count: 22 },
      { type: 'section', id: 'sec-2', name: '4to B', recipient_count: 23 }
    ],
    total_recipients: 45
  },

  reads: {
    read_count: 32,
    read_percentage: 71.1,
    acknowledged_count: 28,
    acknowledged_percentage: 62.2
  },

  pending_users: [
    { id: 'user-1', name: 'Familia Fernández', email: '...' },
    ...
  ]
}
```

#### 7.4 Query de Contenido con Filtros

```
GET /items/announcements
    ?filter[status][_eq]=published
    &filter[_or][0][content_targets][target_type][_eq]=all
    &filter[_or][1][content_targets][target_id][_in]=section-1,section-2
    &sort=-pinned,-published_at

    // Con filtros de usuario:
    &filter[content_user_status][user_id][_eq]=current-user
    &filter[content_user_status][is_archived][_eq]=false
```

---

### 8. Lógica de Query para Targeting

```javascript
// Pseudocódigo para filtrar contenido por audiencia del usuario

async function getContentForUser(contentType, userId, filters = {}) {
  const user = await getUser(userId);
  const children = await getChildrenOf(userId);

  // Obtener jerarquía de los hijos
  const sections = children.map(c => c.section_id);
  const grades = children.map(c => c.grade_id);
  const levels = [...new Set(children.map(c => c.level_id))];

  let query = `
    SELECT DISTINCT c.*
    FROM ${contentType} c
    LEFT JOIN content_targets t ON t.content_type = $1 AND t.content_id = c.id
    LEFT JOIN content_user_status us ON us.content_type = $1
      AND us.content_id = c.id AND us.user_id = $2
    LEFT JOIN content_reads r ON r.content_type = $1
      AND r.content_id = c.id AND r.user_id = $2
    WHERE c.status = 'published'
    AND c.organization_id = $3
    AND (
      t.target_type = 'all'
      OR (t.target_type = 'level' AND t.target_id = ANY($4))
      OR (t.target_type = 'grade' AND t.target_id = ANY($5))
      OR (t.target_type = 'section' AND t.target_id = ANY($6))
      OR (t.target_type = 'user' AND t.target_id = $2)
    )
  `;

  // Aplicar filtros
  if (filters.unread_only) {
    query += ` AND r.id IS NULL`;
  }
  if (filters.archived === false) {
    query += ` AND (us.is_archived IS NULL OR us.is_archived = false)`;
  }
  if (filters.pinned_only) {
    query += ` AND (c.pinned = true OR us.is_pinned = true)`;
  }

  query += ` ORDER BY c.pinned DESC, us.is_pinned DESC, c.published_at DESC`;

  return db.query(query, [
    contentType, userId, user.organization_id,
    levels, grades, sections
  ]);
}
```

---

### 9. Flows / Webhooks

#### 9.1 On Publish → Push Notification

```javascript
// Directus Flow: announcements.items.update
// Condition: status changed to 'published'

module.exports = {
  id: 'send-announcement-notification',
  handler: async ({ payload, key }, { services, database }) => {
    if (payload.status !== 'published') return;

    // Obtener targets
    const targets = await database('content_targets')
      .where({ content_type: 'announcement', content_id: key });

    // Resolver usuarios destinatarios
    const userIds = await resolveTargetUsers(targets, database);

    // Obtener tokens de push
    const tokens = await database('push_tokens')
      .whereIn('user_id', userIds)
      .pluck('token');

    // Enviar push
    await sendPushNotifications(tokens, {
      title: payload.title,
      body: stripHtml(payload.content).substring(0, 100),
      data: {
        type: 'announcement',
        id: key,
        deepLink: `kairos://announcements/${key}`
      }
    });
  }
};
```

#### 9.2 Auto-Unpin Expired

```javascript
// Directus Flow: Schedule (cron every hour)

module.exports = {
  id: 'auto-unpin-expired',
  handler: async (_, { database }) => {
    await database('announcements')
      .where('pinned', true)
      .where('pinned_until', '<', new Date())
      .update({
        pinned: false,
        pinned_at: null,
        pinned_until: null
      });
  }
};
```

---

## Tareas

### Alta Prioridad

- [ ] Agregar campos `pinned`, `pinned_at`, `pinned_until` a `announcements`
- [ ] Agregar campos `requires_acknowledgment`, `acknowledgment_text`
- [ ] Crear tabla cross-functional `content_targets`
- [ ] Crear tabla cross-functional `content_reads`
- [ ] Migrar datos de `target_type`/`target_id` legacy a `content_targets`
- [ ] Implementar query de targeting

### Media Prioridad

- [ ] Crear tabla cross-functional `attachments`
- [ ] Crear tabla cross-functional `content_user_status`
- [ ] Crear extensión Directus: Dashboard de Comunicaciones
- [ ] Implementar componente `AudienceSelector`
- [ ] Crear endpoint de métricas

### Baja Prioridad

- [ ] Crear Flow auto-unpin expirados
- [ ] Crear Flow de push notifications on publish
- [ ] Implementar endpoint de recordatorios
- [ ] Agregar auditoría/logs

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `scripts/setup-schema.sh` | Modificar | Nuevos campos y tablas cross-functional |
| `scripts/setup-relations.sh` | Modificar | Relaciones para nuevas tablas |
| `scripts/setup-roles.sh` | Modificar | Permisos para nuevas colecciones |
| `scripts/migrate-targets.sh` | Crear | Migrar legacy targets |
| `directus/extensions/modules/communications-dashboard/` | Crear | Dashboard custom |
| `directus/extensions/endpoints/metrics/` | Crear | API de métricas |
| `directus/extensions/hooks/notifications/` | Crear | Push on publish |

---

## Permisos por Tabla

| Tabla | Parents | Teachers | Admins |
|-------|---------|----------|--------|
| `content_targets` | Read (own content) | CRUD | CRUD |
| `attachments` | Read | CRUD | CRUD |
| `content_reads` | Create/Read own | Read all | Read all |
| `content_user_status` | CRUD own | CRUD own | CRUD |

---

## Labels

`backend`, `novedades`, `database`, `api`, `cross-functional`, `directus-extension`
