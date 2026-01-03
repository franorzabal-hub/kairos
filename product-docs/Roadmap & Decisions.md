---
title: Roadmap & Decisions
created: 2026-01-01
tags:
  - roadmap
  - decisiones
  - planning
---

# Roadmap & Decisions

Hoja de ruta del producto y registro de decisiones importantes.

---

## Roadmap

### Q1 2026 - Fundación

| Feature | Prioridad | Estado |
|---------|-----------|--------|
| Anuncios y notificaciones | P0 | ✅ Done |
| Eventos con RSVP | P0 | ✅ Done |
| Mensajería directa | P0 | ✅ Done |
| Retiros anticipados | P1 | ✅ Done |
| Multi-tenant básico | P0 | ✅ Done |

### Q2 2026 - Expansión

| Feature | Prioridad | Estado |
|---------|-----------|--------|
| Reportes/Libretas digitales | P1 | 🚧 WIP |
| Galería de fotos por evento | P2 | 📋 Planned |
| Encuestas a padres | P2 | 📋 Planned |
| Dashboard de analytics | P2 | 📋 Planned |

### Q3 2026 - Escala

| Feature | Prioridad | Estado |
|---------|-----------|--------|
| Control de asistencia | P1 | 📋 Planned |
| Integración calendario nativo | P2 | 📋 Planned |
| Pagos/Cuotas | P3 | 💭 Evaluating |
| App para docentes | P2 | 📋 Planned |

---

## Decisiones de Arquitectura (ADRs)

### ADR-001: Frappe Framework como Backend

| | |
|---|---|
| **Fecha** | 2024-12 |
| **Estado** | Aceptado |
| **Contexto** | Necesitamos un backend rápido de implementar con panel admin incluido |
| **Decisión** | Usar Frappe Framework v15 como backend y CMS |
| **Consecuencias** | + Rápido desarrollo, panel admin incluido (Desk), API REST automática, DocTypes para datos. - Requiere aprender Frappe |

### ADR-002: React Native + Expo

| | |
|---|---|
| **Fecha** | 2024-12 |
| **Estado** | Aceptado |
| **Contexto** | App móvil para iOS, Android y potencialmente Web |
| **Decisión** | React Native con Expo managed workflow |
| **Consecuencias** | + Un codebase, OTA updates, fácil CI/CD. - Algunas limitaciones nativas |

### ADR-003: Multi-tenant con Organization ID

| | |
|---|---|
| **Fecha** | 2025-01 |
| **Estado** | Aceptado |
| **Contexto** | Múltiples colegios en una misma instancia |
| **Decisión** | Filtrado por `organization_id` en todas las tablas |
| **Consecuencias** | + Simple, económico. - Requiere políticas de acceso cuidadosas |

### ADR-004: Migración Directus → Frappe

| | |
|---|---|
| **Fecha** | 2025-12 |
| **Estado** | Aceptado |
| **Contexto** | Necesidad de mayor control sobre el modelo de datos y multi-tenancy |
| **Decisión** | Migrar de Directus a Frappe Framework v15 |
| **Consecuencias** | + DocTypes personalizables, multi-tenant nativo. - Esfuerzo de migración |

---

## Backlog de Ideas

> [!note] Ideas para evaluar
> - [ ] Notificaciones de cumpleaños
> - [ ] Integración con Google Classroom
> - [ ] Modo offline para la app
> - [ ] Traducciones (inglés, portugués)
> - [ ] Widget de iOS/Android

---

## Métricas de Éxito

| Métrica | Target | Actual |
|---------|--------|--------|
| Adopción de padres | >80% | - |
| Tiempo de respuesta a retiros | <30 min | - |
| NPS de padres | >50 | - |
| Reducción de WhatsApp grupos | -70% | - |

---

## Links

- [[Overview]] - Contexto del producto
- [[Functional Specs]] - Detalle de módulos
