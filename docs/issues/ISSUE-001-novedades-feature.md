# [Feature] Novedades (Feed / Newsboard) - Funcionalidad Completa

## Descripción

Implementación completa del módulo de **Novedades** como canal de comunicación "uno a muchos" del colegio hacia los padres. El objetivo principal es **informar sin saturar**, proporcionando herramientas de segmentación y confirmación de lectura.

## Objetivo

Permitir que el colegio publique comunicados, circulares y noticias de manera efectiva, llegando solo a la audiencia relevante y teniendo visibilidad de quién recibió/leyó cada comunicación.

---

## Funcionalidades Requeridas

### 1. Segmentación de Audiencia (Targeting)

El sistema debe permitir publicar novedades por niveles:
- **Toda la escuela** - Broadcast general
- **Por nivel** - Solo Primaria, Solo Secundaria, etc.
- **Por grado** - Solo 4to Grado
- **Por sección** - Solo 4to Grado B
- **Usuarios específicos** - Selección manual de destinatarios

**Criterios de aceptación:**
- [ ] Al crear una novedad, el autor puede seleccionar la audiencia objetivo
- [ ] Los padres solo ven novedades dirigidas a ellos o sus hijos
- [ ] El filtrado respeta la jerarquía: Nivel → Grado → Sección
- [ ] Soporte para múltiples targets (ej: "3ro A" Y "4to B")

### 2. Rich Media & Adjuntos

Soporte nativo para contenido multimedia:
- **Imágenes** - Múltiples imágenes por novedad, galería
- **Videos** - Incrustados (YouTube, Vimeo) o subidos
- **PDFs** - Para circulares formales con preview sin descarga obligatoria
- **Otros archivos** - Word, Excel, etc.

**Criterios de aceptación:**
- [ ] Soporte para múltiples archivos adjuntos por novedad
- [ ] Preview de PDFs inline en la app
- [ ] Preview de imágenes en galería con zoom
- [ ] Reproducción de videos incrustados
- [ ] Indicador visual del tipo de adjunto
- [ ] Opción de descarga para todos los adjuntos

### 3. Confirmación de Lectura (Acknowledgment)

Para comunicaciones críticas, el colegio necesita saber quién leyó:
- **Métricas de apertura** - Quién abrió la noticia y cuándo
- **Confirmación explícita** - Botón "He leído y acepto" para comunicados importantes
- **Dashboard de seguimiento** - Vista para teachers/admin con % de lectura

**Criterios de aceptación:**
- [ ] Registro en servidor de cada lectura (usuario, timestamp)
- [ ] Flag `requires_acknowledgment` para novedades que necesitan confirmación explícita
- [ ] Botón "He leído y acepto" visible cuando es requerido
- [ ] Panel de métricas mostrando: leídos, pendientes, confirmados
- [ ] Posibilidad de enviar recordatorio a quienes no leyeron

### 4. Notificaciones Push Inteligentes

Sistema de notificaciones efectivo:
- **Título claro** - El push debe comunicar la esencia del mensaje
- **Deep linking** - Al tocar, ir directo a la novedad (no a home)
- **Respeto de preferencias** - No enviar push si el usuario optó out

**Criterios de aceptación:**
- [ ] Push notification al publicar novedad
- [ ] Deep link funcional a la novedad específica
- [ ] Segmentación de push según audiencia de la novedad
- [ ] Preview del contenido en la notificación (si el OS lo permite)

### 5. Fijar Novedades (Pinning)

Mantener comunicaciones importantes visibles:
- **Pinned en top** - Novedades fijadas siempre arriba del feed
- **Múltiples pins** - Puede haber más de una novedad fijada
- **Fecha de expiración del pin** - Auto-unpin después de X días

**Criterios de aceptación:**
- [ ] Campo `pinned` y `pinned_until` en el modelo
- [ ] Novedades pinneadas aparecen primero, ordenadas por fecha de pin
- [ ] Indicador visual de novedad fijada
- [ ] Solo admin/teachers pueden fijar novedades
- [ ] Auto-unpin cuando expira `pinned_until`

---

## Issues Relacionados

- **Backend**: #ISSUE-002 - [Backend] Novedades - API y Modelo de Datos
- **Frontend**: #ISSUE-003 - [Frontend] Novedades - App Móvil

---

## Prioridad

**Alta** - Funcionalidad core de la aplicación

## Labels

`feature`, `novedades`, `communication`, `priority:high`
