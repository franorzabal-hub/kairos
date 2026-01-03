---
title: Overview
created: 2026-01-01
tags:
  - overview
  - kairos
  - vision
---

# Overview

## Qué es Kairos

Kairos es una plataforma de comunicación escuela-familia que conecta colegios con padres a través de una app móvil moderna y un panel administrativo.

---

## Problema que Resuelve

> [!question] Pain Points Actuales
> - Comunicación fragmentada (WhatsApp grupos, emails, cuadernos)
> - Falta de trazabilidad en mensajes importantes
> - Dificultad para gestionar autorizaciones y retiros
> - Información escolar dispersa y difícil de encontrar

---

## Solución

| Para Colegios | Para Familias |
|---------------|---------------|
| Panel centralizado (Directus) | App móvil unificada |
| Envío de anuncios y eventos | Notificaciones push |
| Gestión de retiros anticipados | Solicitud de retiros en 2 taps |
| Reportes y libretas digitales | Acceso a documentos escolares |
| Mensajería directa con padres | Chat con docentes |

---

## Usuarios

### Roles en el Sistema

| Rol | Plataforma | Capacidades |
|-----|------------|-------------|
| **Admin** | Directus Web | Configuración completa del colegio |
| **Docente** | Directus Web | Anuncios, eventos, mensajes de su sección |
| **Staff** | Directus Web | Gestión de retiros, comunicados |
| **Padre/Tutor** | App Móvil | Recibir info, solicitar retiros, chatear |

---

## Arquitectura de Alto Nivel

```
┌─────────────────┐     ┌─────────────────┐
│   App Móvil     │────▶│    Directus     │
│ (React Native)  │     │   (Backend)     │
└─────────────────┘     └────────┬────────┘
                                 │
                        ┌────────▼────────┐
                        │   PostgreSQL    │
                        │   (Cloud SQL)   │
                        └─────────────────┘
```

---

## Links Relacionados

- [[Functional Specs]] - Detalle de cada módulo
- [[Design System]] - Guía visual
- [[Roadmap & Decisions]] - Próximos pasos

---

> [!info] Documentación Técnica
> Para detalles de implementación, ver `/docs/` en el repositorio.
