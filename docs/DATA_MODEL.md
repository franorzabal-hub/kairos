# Kairos - Modelo de Datos

## Visión General

App de comunicación padres-colegio. Multi-tenant (cada colegio es un tenant independiente).

## Entidades Principales

```
┌─────────────────────────────────────────────────────────────────┐
│                        ESTRUCTURA                               │
├─────────────────────────────────────────────────────────────────┤
│  organizations ──┬── users (admin, teachers, parents)          │
│                  ├── students                                   │
│                  ├── grades (grados: 1ro, 2do, 3ro...)         │
│                  ├── sections (divisiones: A, B, C...)         │
│                  └── locations (aulas, patio, SUM...)          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      COMUNICACIÓN                               │
├─────────────────────────────────────────────────────────────────┤
│  announcements ──── Novedades (info general)                    │
│  events ─────────── Eventos (con confirmación de asistencia)    │
│  messages ───────── Mensajes (threads, respuestas)              │
│  pickup_requests ── Cambios de salida                           │
│  reports ────────── Boletines e informes                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Collections

### 1. organizations (Colegios)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| name | string | Nombre del colegio |
| slug | string | URL-friendly identifier |
| logo | file | Logo del colegio |
| address | string | Dirección |
| phone | string | Teléfono |
| email | string | Email de contacto |
| settings | json | Configuraciones (horarios, etc) |
| status | enum | active, inactive |
| created_at | timestamp | |
| updated_at | timestamp | |

---

### 2. users (Usuarios del sistema)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK (extiende directus_users) |
| organization_id | uuid | FK → organizations |
| role | enum | admin, teacher, parent, staff |
| first_name | string | Nombre |
| last_name | string | Apellido |
| email | string | Email (login) |
| phone | string | Teléfono |
| avatar | file | Foto de perfil |
| status | enum | active, inactive |
| created_at | timestamp | |

**Roles:**
- `admin`: Directivo del colegio, acceso total
- `teacher`: Profesor, puede crear contenido
- `parent`: Padre/tutor, solo lectura + cambios de salida
- `staff`: Personal no docente

---

### 3. students (Alumnos)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| first_name | string | Nombre |
| last_name | string | Apellido |
| birth_date | date | Fecha de nacimiento |
| dni | string | Documento |
| section_id | uuid | FK → sections (3ro A) |
| photo | file | Foto |
| medical_info | text | Info médica relevante |
| status | enum | active, inactive, graduated |
| created_at | timestamp | |

---

### 4. student_guardians (Relación alumno-tutor)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| student_id | uuid | FK → students |
| user_id | uuid | FK → users (parent) |
| relationship | enum | mother, father, guardian, other |
| is_primary | boolean | Contacto principal |
| can_pickup | boolean | Autorizado a retirar |
| created_at | timestamp | |

---

### 5. grades (Grados)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| name | string | "1er Grado", "2do Grado", etc |
| level | enum | initial, primary, secondary |
| order | integer | Para ordenar |

---

### 6. sections (Divisiones/Secciones)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| grade_id | uuid | FK → grades |
| name | string | "A", "B", "C" |
| teacher_id | uuid | FK → users (maestro a cargo) |
| school_year | integer | 2024, 2025... |
| capacity | integer | Capacidad máxima |

---

### 7. locations (Lugares físicos)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| name | string | "Aula 101", "Patio", "SUM" |
| type | enum | classroom, gym, auditorium, outdoor, office |
| capacity | integer | Capacidad |

---

### 8. announcements (Novedades)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| author_id | uuid | FK → users |
| title | string | Título |
| content | text | Contenido (markdown) |
| priority | enum | normal, important, urgent |
| target_type | enum | all, grade, section |
| target_id | uuid | FK → grade o section (nullable) |
| publish_at | timestamp | Cuándo publicar |
| expires_at | timestamp | Cuándo expira (nullable) |
| attachments | files | Archivos adjuntos |
| status | enum | draft, published, archived |
| created_at | timestamp | |

---

### 9. events (Eventos)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| author_id | uuid | FK → users |
| title | string | Título del evento |
| description | text | Descripción |
| location_id | uuid | FK → locations (nullable) |
| location_external | string | Si es fuera del colegio |
| start_date | timestamp | Inicio |
| end_date | timestamp | Fin |
| all_day | boolean | Evento de día completo |
| requires_confirmation | boolean | Requiere confirmar asistencia |
| confirmation_deadline | timestamp | Fecha límite confirmación |
| target_type | enum | all, grade, section |
| target_id | uuid | FK → grade o section |
| status | enum | draft, published, cancelled |
| created_at | timestamp | |

---

### 10. event_responses (Respuestas a eventos)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| event_id | uuid | FK → events |
| student_id | uuid | FK → students |
| user_id | uuid | FK → users (quien responde) |
| response | enum | attending, not_attending, maybe |
| notes | text | Notas opcionales |
| responded_at | timestamp | |

---

### 11. messages (Mensajes)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| parent_id | uuid | FK → messages (para threads) |
| author_id | uuid | FK → users |
| subject | string | Asunto (solo mensaje raíz) |
| content | text | Contenido |
| target_type | enum | all, grade, section, user |
| target_id | uuid | FK según target_type |
| allow_replies | boolean | Permitir respuestas |
| attachments | files | Archivos adjuntos |
| status | enum | sent, read, archived |
| created_at | timestamp | |

---

### 12. message_reads (Lecturas de mensajes)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| message_id | uuid | FK → messages |
| user_id | uuid | FK → users |
| read_at | timestamp | |

---

### 13. pickup_requests (Cambios de salida)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| student_id | uuid | FK → students |
| requested_by | uuid | FK → users (padre que solicita) |
| request_type | enum | different_time, different_person, both |
| pickup_date | date | Fecha del cambio |
| pickup_time | time | Nueva hora (si aplica) |
| authorized_person | string | Nombre de quien retira |
| authorized_dni | string | DNI de quien retira |
| authorized_relationship | string | Relación con el alumno |
| reason | text | Motivo |
| status | enum | pending, approved, rejected |
| reviewed_by | uuid | FK → users (quien aprueba) |
| reviewed_at | timestamp | |
| notes | text | Notas del revisor |
| created_at | timestamp | |

---

### 14. reports (Boletines e informes)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | PK |
| organization_id | uuid | FK → organizations |
| student_id | uuid | FK → students |
| author_id | uuid | FK → users |
| type | enum | report_card, progress, behavior, other |
| title | string | Título |
| period | string | "1er Trimestre 2024" |
| content | text | Contenido/observaciones |
| file | file | PDF del boletín |
| visible_to_parents | boolean | Visible para padres |
| published_at | timestamp | |
| created_at | timestamp | |

---

## Diagrama de Relaciones

```
organizations (tenant)
    │
    ├── users ←──────────────────┐
    │     │                       │
    │     └── student_guardians ──┼── students
    │                             │       │
    ├── grades                    │       │
    │     │                       │       │
    │     └── sections ───────────┘       │
    │           │                         │
    │           └─────────────────────────┘
    │
    ├── locations
    │
    ├── announcements
    │
    ├── events
    │     └── event_responses
    │
    ├── messages
    │     └── message_reads
    │
    ├── pickup_requests
    │
    └── reports
```

---

## Seguridad (Row-Level Security)

Todas las queries filtran por `organization_id`:

| Rol | Permisos |
|-----|----------|
| Admin | CRUD en todo su colegio |
| Teacher | Create en announcements, events, messages, reports. Read en students de sus secciones |
| Parent | Read en contenido de sus hijos. Create en pickup_requests y respuestas |
| Staff | Read en announcements, events. Create en pickup_requests |

---

## Índices Recomendados

```sql
-- Búsquedas frecuentes
CREATE INDEX idx_students_section ON students(section_id);
CREATE INDEX idx_students_org ON students(organization_id);
CREATE INDEX idx_announcements_org_status ON announcements(organization_id, status);
CREATE INDEX idx_events_org_date ON events(organization_id, start_date);
CREATE INDEX idx_messages_org_parent ON messages(organization_id, parent_id);
CREATE INDEX idx_pickup_org_date ON pickup_requests(organization_id, pickup_date);
CREATE INDEX idx_guardians_student ON student_guardians(student_id);
CREATE INDEX idx_guardians_user ON student_guardians(user_id);
```
