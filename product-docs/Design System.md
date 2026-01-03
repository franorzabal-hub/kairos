---
title: Design System
created: 2026-01-01
tags:
  - design
  - ui
  - componentes
---

# Design System

Guía de diseño para mantener consistencia visual en Kairos.

---

## Paleta de Colores

### Colores Primarios

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Primary** | `#2563EB` | Acciones principales, links |
| **Primary Dark** | `#1D4ED8` | Hover states |
| **Primary Light** | `#DBEAFE` | Backgrounds sutiles |

### Colores Semánticos

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Success** | `#22C55E` | Confirmaciones, éxito |
| **Warning** | `#F59E0B` | Alertas, pendientes |
| **Error** | `#EF4444` | Errores, destructivo |
| **Info** | `#3B82F6` | Información neutral |

### Neutros

| Nombre | Hex | Uso |
|--------|-----|-----|
| **Gray 900** | `#111827` | Texto principal |
| **Gray 600** | `#4B5563` | Texto secundario |
| **Gray 200** | `#E5E7EB` | Bordes, divisores |
| **Gray 50** | `#F9FAFB` | Backgrounds |

---

## Tipografía

| Elemento | Font | Tamaño | Peso |
|----------|------|--------|------|
| **H1** | System | 28px | Bold |
| **H2** | System | 22px | Semibold |
| **H3** | System | 18px | Semibold |
| **Body** | System | 16px | Regular |
| **Caption** | System | 14px | Regular |
| **Small** | System | 12px | Regular |

> [!note] Fuentes del Sistema
> Usamos fuentes nativas para mejor rendimiento:
> - iOS: SF Pro
> - Android: Roboto

---

## Espaciado

Sistema de 4px base:

| Token | Valor | Uso |
|-------|-------|-----|
| `xs` | 4px | Espaciado mínimo |
| `sm` | 8px | Entre elementos relacionados |
| `md` | 16px | Padding de cards |
| `lg` | 24px | Entre secciones |
| `xl` | 32px | Márgenes de pantalla |

---

## Componentes

### Botones

| Variante | Uso |
|----------|-----|
| **Primary** | Acción principal (1 por pantalla) |
| **Secondary** | Acciones secundarias |
| **Ghost** | Acciones terciarias, links |
| **Destructive** | Eliminar, cancelar |

### Cards

```
┌─────────────────────────────┐
│ [Icon]  Title               │
│         Subtitle            │
│                             │
│  Content area               │
│                             │
│         [Action Button]     │
└─────────────────────────────┘
```

### Empty States

> [!tip] Siempre incluir
> - Ilustración o icono relevante
> - Mensaje claro de qué está vacío
> - CTA para resolver (si aplica)

---

## Iconografía

Usamos **Lucide Icons** por su consistencia y disponibilidad en React Native.

| Contexto | Iconos Comunes |
|----------|----------------|
| Navegación | `home`, `calendar`, `message-circle`, `user` |
| Acciones | `plus`, `edit`, `trash`, `check` |
| Estado | `alert-circle`, `check-circle`, `info` |

---

## Links

- [[Functional Specs]] - Contexto funcional
- [[Overview]] - Visión del producto
