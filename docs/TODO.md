# Kairos - TODO / Roadmap

## Estado actual

- [x] Modelo de datos diseñado (16 tablas + extensibilidad)
- [x] Configuración Docker local
- [x] Proyecto GCloud creado
- [ ] Deploy a Cloud Run
- [ ] Schema en Directus
- [ ] Mobile app

---

## Fase 1: Backend MVP

### Infraestructura GCloud
- [ ] Habilitar APIs (Cloud Run, SQL, Storage, Secrets)
- [ ] Crear Cloud SQL PostgreSQL
- [ ] Crear bucket de Storage
- [ ] Crear secrets (directus-secret, db-password)
- [ ] Deploy Directus a Cloud Run

### Configuración Directus
- [ ] Importar schema (16 collections base)
- [ ] Configurar roles y permisos
- [ ] Crear policies de Row-Level Security
- [ ] Configurar webhooks para notificaciones
- [ ] Seed data de ejemplo

### Extensibilidad
- [ ] Crear collection `custom_field_definitions`
- [ ] Crear collection `custom_tables`
- [ ] UI para que admins creen campos custom
- [ ] API para tablas custom dinámicas

---

## Fase 2: API & Auth

### Autenticación
- [ ] Configurar auth de Directus
- [ ] Flujo de registro de colegios
- [ ] Flujo de invitación de usuarios
- [ ] Refresh tokens
- [ ] Password reset

### API endpoints
- [ ] Documentar endpoints REST/GraphQL
- [ ] Rate limiting por tenant
- [ ] Validaciones custom
- [ ] Filtros por rol

---

## Fase 3: Mobile App (React Native)

### Setup
- [ ] Inicializar proyecto React Native
- [ ] Configurar navegación
- [ ] Configurar estado (Zustand/Redux)
- [ ] Configurar cliente API

### Screens - Padres
- [ ] Login / Register
- [ ] Home (resumen)
- [ ] Novedades (lista + detalle)
- [ ] Eventos (lista + confirmar asistencia)
- [ ] Mensajes (inbox + threads)
- [ ] Cambios de salida (solicitar)
- [ ] Boletines (lista + PDF viewer)
- [ ] Perfil

### Screens - Profesores
- [ ] Crear novedad
- [ ] Crear evento
- [ ] Enviar mensaje
- [ ] Aprobar cambios de salida
- [ ] Subir boletín

### Push Notifications
- [ ] Configurar Firebase Cloud Messaging
- [ ] Webhooks Directus → FCM
- [ ] Permisos de notificaciones
- [ ] Deep linking

---

## Fase 4: Web Admin

### Panel de colegio
- [ ] Dashboard con métricas
- [ ] Gestión de usuarios
- [ ] Gestión de alumnos (import CSV)
- [ ] Gestión de grados/secciones
- [ ] Configuración del colegio

### Panel de extensibilidad
- [ ] UI para crear campos custom
- [ ] UI para crear tablas custom
- [ ] Preview de formularios custom

---

## Fase 5: Features avanzados

### Comunicación
- [ ] Mensajes con read receipts
- [ ] Mensajes programados
- [ ] Templates de mensajes
- [ ] Filtros avanzados de destinatarios

### Reportes
- [ ] Dashboard de engagement
- [ ] Exportar datos (CSV, Excel)
- [ ] Reportes por período

### Integraciones
- [ ] Google Calendar sync
- [ ] WhatsApp notifications
- [ ] SMS fallback

---

## Fase 6: Productización

### Onboarding
- [ ] Wizard de registro de colegio
- [ ] Import masivo de datos
- [ ] Templates de configuración

### Billing
- [ ] Planes (free, basic, premium)
- [ ] Stripe integration
- [ ] Límites por plan

### Multi-idioma
- [ ] i18n en mobile app
- [ ] i18n en Directus

---

## Backlog / Ideas

- [ ] Chat en tiempo real (WebSockets)
- [ ] Calendario integrado
- [ ] Galería de fotos por evento
- [ ] Encuestas
- [ ] Formularios custom
- [ ] Integración con sistemas de gestión escolar
- [ ] API pública para integraciones
- [ ] White-label para colegios grandes

---

## Bugs conocidos

(ninguno por ahora)

---

## Decisiones técnicas pendientes

1. **Mobile framework**: React Native vs Flutter
2. **State management**: Zustand vs Redux Toolkit
3. **Push notifications**: FCM vs OneSignal
4. **Offline support**: WatermelonDB vs MMKV + custom sync
5. **Real-time**: Directus websockets vs custom Socket.io
