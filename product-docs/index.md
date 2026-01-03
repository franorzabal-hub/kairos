---
title: Kairos Product Docs
created: 2026-01-01
tags:
  - index
  - kairos
  - documentation
---

# Kairos Product Docs

Fuente única de verdad para la documentación funcional de Kairos, la plataforma de comunicación escuela-familia.

---

## Secciones

| Sección | Descripción |
|---------|-------------|
| [[Overview]] | Visión general del producto y objetivos |
| [[Functional Specs]] | Especificaciones funcionales detalladas |
| [[Design System]] | Guía de diseño, componentes y estilos |
| [[Roadmap & Decisions]] | Hoja de ruta y decisiones de producto |

---

## Quick Links

| Recurso | URL |
|---------|-----|
| **GitHub** | [franorzabal-hub/kairos](https://github.com/franorzabal-hub/kairos) |
| **Directus (Prod)** | [kairos-directus](https://kairos-directus-684614817316.us-central1.run.app) |
| **GCP Project** | `kairos-escuela-app` (us-central1) |

---

## Stack

| Capa | Tecnología | Uso |
|------|------------|-----|
| **Panel Colegios** | Directus Admin (Web) | Docentes y admins gestionan contenido |
| **App Padres** | React Native + Expo | iOS, Android y Web para familias |
| **Backend** | Directus v11 | API REST/GraphQL + Headless CMS |
| **Database** | PostgreSQL 16 | Cloud SQL en GCP |
| **Cloud** | Google Cloud Platform | Cloud Run + Cloud SQL + GCS |

---

## Navegación

> [!tip] Estructura de Documentación
> - `product-docs/` - Documentación funcional (este vault)
> - `docs/` - Documentación técnica para desarrollo
> - `CLAUDE.md` - Instrucciones para Claude Code
